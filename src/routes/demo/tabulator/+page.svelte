<script lang="ts">
	import { onMount } from 'svelte';
	import {
		TabulatorFull as Tabulator,
		type CellComponent,
		type ColumnDefinition,
		type Options
	} from 'tabulator-tables';
	import 'tabulator-tables/dist/css/tabulator.min.css';

	import {
		TABULATOR_DEMO_DATA,
		countRows,
		countVisibleByName,
		nameSubtreeMatches,
		type EmployeeRow
	} from './demo-data';

	const totalRows = countRows(TABULATOR_DEMO_DATA);

	// --- Tree-aware range paste action -------------------------------------
	// Tabulator's built-in "range" paste action resolves its target rows from
	// `rowManager.activeRows`, which does NOT contain tree child rows. As a
	// result, pasting a copied range into any nested (child) row silently does
	// nothing. This custom action mirrors the built-in one but resolves targets
	// from `getDisplayRows()`, the flattened list of currently displayed rows
	// that DOES include expanded tree children, so copy/paste works everywhere.
	type InternalRow = { updateData(values: Record<string, unknown>): Promise<void> };
	type InternalCell = { row: InternalRow };
	type InternalRange = { getBounds(): { start: InternalCell; end: InternalCell } };
	type PasteContext = {
		table: {
			modules: { selectRange: { activeRange: InternalRange | false } };
			rowManager: { getDisplayRows(): InternalRow[] };
			blockRedraw(): void;
			restoreRedraw(): void;
		};
	};

	function treeRangePasteAction(this: PasteContext, data: Record<string, unknown>[]): InternalRow[] {
		const range = this.table.modules.selectRange.activeRange;
		if (!range || data.length === 0) return [];

		const { start, end } = range.getBounds();
		const displayRows = this.table.rowManager.getDisplayRows();
		const startRow = displayRows.indexOf(start.row);
		if (startRow < 0) return [];

		// A single selected cell pastes the whole clipboard block downward; a
		// larger selection is filled (tiling the clipboard if it is smaller).
		const singleCell = start === end;
		const rowSpan = singleCell ? data.length : displayRows.indexOf(end.row) - startRow + 1;
		const targets = displayRows.slice(startRow, startRow + rowSpan);

		this.table.blockRedraw();
		targets.forEach((row, i) => row.updateData(data[i % data.length]));
		this.table.restoreRedraw();

		return targets;
	}

	const moneyFormatter = new Intl.NumberFormat('ru-RU', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	});

	const dateFormatter = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' });

	const columns: ColumnDefinition[] = [
		{
			title: 'Сотрудник',
			field: 'name',
			minWidth: 280,
			editor: 'input',
			// String filter rendered in the column header. A tree-aware predicate
			// keeps a row visible when its own name OR any descendant's name matches,
			// so searching for a nested person also reveals the ancestor chain.
			// (Tabulator's built-in `like` filter hides any node whose parent does
			// not match, which makes nested matches disappear entirely.)
			headerFilter: 'input',
			headerFilterPlaceholder: 'Поиск по имени…',
			headerFilterFunc: (headerValue: string, _rowValue: unknown, rowData: EmployeeRow) =>
				nameSubtreeMatches(rowData, headerValue)
		},
		{
			title: 'Должность',
			field: 'role',
			minWidth: 180,
			editor: 'input'
		},
		{
			title: 'Отдел',
			field: 'department',
			minWidth: 160,
			editor: 'input'
		},
		{
			title: 'Зарплата',
			field: 'salary',
			minWidth: 140,
			hozAlign: 'right',
			editor: 'number',
			editorParams: { min: 0, step: 1000 },
			formatter: (cell: CellComponent) => {
				const value = cell.getValue();
				return value == null ? '' : moneyFormatter.format(Number(value));
			}
		},
		{
			title: 'Прогресс',
			field: 'progress',
			minWidth: 130,
			hozAlign: 'right',
			editor: 'number',
			editorParams: { min: 0, max: 100, step: 5 },
			formatter: (cell: CellComponent) => {
				const value = cell.getValue();
				return value == null ? '' : `${Number(value)}%`;
			}
		},
		{
			title: 'Дата найма',
			field: 'startDate',
			minWidth: 150,
			editor: 'date',
			formatter: (cell: CellComponent) => {
				const value = cell.getValue();
				if (!value) return '';
				const date = new Date(value);
				return Number.isNaN(date.getTime()) ? String(value) : dateFormatter.format(date);
			}
		}
	];

	let tableDiv: HTMLDivElement;
	let table: Tabulator | null = null;
	let visibleRows = $state(totalRows);

	onMount(() => {
		const options: Options = {
			data: structuredClone(TABULATOR_DEMO_DATA),
			columns,
			layout: 'fitColumns',
			height: '100%',
			reactiveData: false,
			// Tree (hierarchical) data — children live in the `_children` field.
			dataTree: true,
			dataTreeChildField: '_children',
			dataTreeStartExpanded: true,
			dataTreeElementColumn: 'name',
			// Edit on double click so a single click / drag selects ranges instead.
			editTriggerEvent: 'dblclick',
			// Dedicated leftmost row-number column so clicking a row header selects
			// the whole row, while data cells (including `name`) stay individually
			// selectable and editable.
			rowHeader: {
				resizable: false,
				frozen: true,
				width: 44,
				hozAlign: 'center',
				headerSort: false,
				formatter: 'rownum'
			},
			// Spreadsheet-style range selection of cells, whole columns and rows.
			selectableRange: true,
			selectableRangeColumns: true,
			selectableRangeRows: true,
			selectableRangeClearCells: true,
			// Mass copy / paste over the selected range via Ctrl+C / Ctrl+V.
			clipboard: true,
			clipboardCopyStyled: false,
			clipboardCopyConfig: { columnHeaders: false, rowHeaders: false },
			clipboardCopyRowRange: 'range',
			clipboardPasteParser: 'range',
			// Custom tree-aware action (see treeRangePasteAction above); the runtime
			// accepts a function here even though the typings only list the presets.
			clipboardPasteAction: treeRangePasteAction as unknown as Options['clipboardPasteAction']
		};

		table = new Tabulator(tableDiv, options);

		// `getRows('active')` only returns top-level rows, so it cannot count
		// visible tree children. Derive the count from the current name filter
		// value instead, using the same predicate the column filter applies.
		const updateVisible = () => {
			const term = (table?.getHeaderFilterValue('name') as string) ?? '';
			visibleRows = countVisibleByName(TABULATOR_DEMO_DATA, term);
		};
		table.on('dataFiltered', updateVisible);
		table.on('tableBuilt', updateVisible);

		return () => {
			table?.destroy();
			table = null;
		};
	});

	function expandAll() {
		for (const row of table?.getRows() ?? []) {
			row.treeExpand();
		}
	}

	function collapseAll() {
		for (const row of table?.getRows() ?? []) {
			row.treeCollapse();
		}
	}
</script>

<svelte:head>
	<title>Tabulator tree data demo</title>
</svelte:head>

<main class="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-950 sm:px-6 lg:px-8">
	<section class="mx-auto flex h-[calc(100vh-3rem)] max-w-7xl flex-col gap-5">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p class="text-sm font-medium text-teal-700">Svelte 5 + Tabulator</p>
				<h1 class="mt-1 text-3xl font-semibold tracking-normal">Tabulator tree data demo</h1>
				<p class="mt-1 text-sm text-zinc-500">
					Древовидные данные, сгенерированные через faker. Строки, числа и даты редактируются.
				</p>
				<p class="mt-1 text-sm text-zinc-500">
					Двойной клик — редактирование ячейки. Выделяйте диапазон ячеек мышью, копируйте и
					вставляйте через Ctrl+C / Ctrl+V. Фильтр по имени — в заголовке первой колонки.
				</p>
			</div>

			<div class="flex items-end gap-4">
				<div class="rounded-lg border border-zinc-200 bg-white px-4 py-2 shadow-sm">
					<span class="block text-xl font-semibold" data-testid="visible-row-count">
						{visibleRows} / {totalRows}
					</span>
					<span class="text-xs text-zinc-500">строк</span>
				</div>
				<div class="flex gap-2">
					<button
						type="button"
						class="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:border-teal-500 hover:text-teal-700"
						onclick={expandAll}
					>
						Раскрыть все
					</button>
					<button
						type="button"
						class="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:border-teal-500 hover:text-teal-700"
						onclick={collapseAll}
					>
						Свернуть все
					</button>
				</div>
			</div>
		</div>

		<div
			bind:this={tableDiv}
			class="min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
			data-testid="tabulator-grid"
		></div>
	</section>
</main>
