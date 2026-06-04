<script lang="ts">
	import { browser } from '$app/environment';
	import { Grid, Willow, type IApi, type IColumnConfig, type IRow } from '@svar-ui/svelte-grid';
	import { SvelteSet } from 'svelte/reactivity';

	import { SVAR_DEMO_TREE, countRows, filterTreeByName } from './demo-data';

	const moneyFormatter = new Intl.NumberFormat('ru-RU', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	});
	const numberFormatter = new Intl.NumberFormat('ru-RU');
	const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});

	// SVAR ships text/datepicker editors out of the box; a number field is the
	// text editor switched to `type: number`.
	const numberEditor = {
		type: 'text',
		config: { type: 'number' }
	} as IColumnConfig['editor'];

	const columns: IColumnConfig[] = [
		{
			id: 'name',
			header: 'Подразделение / сотрудник',
			flexgrow: 2,
			treetoggle: true,
			sort: true,
			editor: 'text'
		},
		{
			id: 'role',
			header: 'Роль',
			width: 170,
			sort: true,
			editor: 'text'
		},
		{
			id: 'location',
			header: 'Локация',
			width: 170,
			sort: true,
			editor: 'text'
		},
		{
			id: 'headcount',
			header: 'Штат',
			width: 110,
			sort: true,
			editor: numberEditor,
			template: (value) => numberFormatter.format(Number(value ?? 0))
		},
		{
			id: 'budget',
			header: 'Бюджет',
			width: 150,
			sort: true,
			editor: numberEditor,
			template: (value) => moneyFormatter.format(Number(value ?? 0))
		},
		{
			id: 'startDate',
			header: 'Старт',
			width: 150,
			sort: true,
			editor: 'datepicker',
			template: (value) => (value ? dateFormatter.format(new Date(value as Date)) : '—')
		}
	];

	const columnOrder = columns.map((column) => String(column.id));
	const NUMERIC_COLUMNS = new Set(['headcount', 'budget']);

	let nameFilter = $state('');
	let expanded = $state(true);
	const filteredData = $derived(filterTreeByName(SVAR_DEMO_TREE, nameFilter, expanded));
	const totalRows = countRows(SVAR_DEMO_TREE);
	const visibleRows = $derived(countRows(filteredData));

	// --- Spreadsheet-style cell range selection ---------------------------------
	// SVAR's built-in selection is row-level, so we layer a rectangular cell
	// selection on top: drag to pick a range, Ctrl/Cmd+C to copy it as TSV.
	let gridApi: IApi | undefined;
	const selectedCells = new SvelteSet<string>();
	let rangeRows = $state<Array<string | number>>([]);
	let rangeCols = $state<string[]>([]);
	let anchor: { rowId: string | number; colId: string } | null = null;
	let dragging = $state(false);

	const cellKey = (rowId: string | number, colId: string) => `${rowId}::${colId}`;

	function cellStyle(row: IRow, column: { id?: string | number }) {
		return selectedCells.has(cellKey(row.id, String(column.id))) ? 'svar-range-cell' : '';
	}

	function parseDomId(value: string | null): string | number | null {
		if (value == null) return null;
		if (value.startsWith(':')) return value.slice(1);
		const asNumber = Number(value);
		return Number.isNaN(asNumber) ? value : asNumber;
	}

	function cellFromEvent(ev: MouseEvent): { rowId: string | number; colId: string } | null {
		const target = (ev.target as HTMLElement | null)?.closest('[data-row-id][data-col-id]');
		if (!target) return null;
		const rowId = parseDomId(target.getAttribute('data-row-id'));
		const colId = parseDomId(target.getAttribute('data-col-id'));
		if (rowId == null || colId == null) return null;
		return { rowId, colId: String(colId) };
	}

	function applyRange(focusRowId: string | number, focusColId: string) {
		const state = gridApi?.getState();
		if (!state || !anchor) return;

		const rowIds = state.flatData.map((row) => row.id);
		const aRow = rowIds.indexOf(anchor.rowId);
		const fRow = rowIds.indexOf(focusRowId);
		const aCol = columnOrder.indexOf(anchor.colId);
		const fCol = columnOrder.indexOf(focusColId);
		if (aRow < 0 || fRow < 0 || aCol < 0 || fCol < 0) return;

		const rows = rowIds.slice(Math.min(aRow, fRow), Math.max(aRow, fRow) + 1);
		const cols = columnOrder.slice(Math.min(aCol, fCol), Math.max(aCol, fCol) + 1);

		selectedCells.clear();
		for (const rowId of rows) {
			for (const colId of cols) {
				selectedCells.add(cellKey(rowId, colId));
			}
		}
		rangeRows = rows;
		rangeCols = cols;
	}

	function clearRange() {
		selectedCells.clear();
		rangeRows = [];
		rangeCols = [];
		anchor = null;
	}

	function onCellMouseDown(ev: MouseEvent) {
		if (ev.button !== 0) return;
		const cell = cellFromEvent(ev);
		if (!cell) return;
		anchor = cell;
		dragging = true;
		applyRange(cell.rowId, cell.colId);
	}

	function onWindowMouseMove(ev: MouseEvent) {
		if (!dragging || !anchor) return;
		const cell = cellFromEvent(ev);
		if (cell) applyRange(cell.rowId, cell.colId);
	}

	function onWindowMouseUp() {
		dragging = false;
	}

	function formatForCopy(row: IRow | undefined, colId: string): string {
		const value = row?.[colId];
		if (value == null) return '';
		if (colId === 'startDate') return dateFormatter.format(new Date(value as Date));
		return String(value);
	}

	function copyRange() {
		if (!rangeRows.length || !gridApi) return;
		const tsv = rangeRows
			.map((rowId) =>
				rangeCols.map((colId) => formatForCopy(gridApi?.getRow(rowId), colId)).join('\t')
			)
			.join('\n');
		void navigator.clipboard?.writeText(tsv);
	}

	function onWindowKeyDown(ev: KeyboardEvent) {
		if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'c' && rangeRows.length) {
			const editing = (ev.target as HTMLElement | null)?.closest('input, textarea');
			if (editing) return;
			copyRange();
		}
	}

	const selectionSummary = $derived.by(() => {
		if (!rangeRows.length || !gridApi) return null;
		let cells = 0;
		let numericCells = 0;
		let sum = 0;
		for (const rowId of rangeRows) {
			const row = gridApi.getRow(rowId);
			for (const colId of rangeCols) {
				cells++;
				if (NUMERIC_COLUMNS.has(colId)) {
					numericCells++;
					sum += Number(row?.[colId] ?? 0);
				}
			}
		}
		return { cells, numericCells, sum };
	});

	// Re-filtering re-inits the grid, so any lingering cell range is meaningless.
	function setExpanded(value: boolean) {
		expanded = value;
		clearRange();
	}

	function onFilterInput() {
		clearRange();
	}

	function clearFilter() {
		nameFilter = '';
		clearRange();
	}
</script>

<svelte:head>
	<title>SVAR DataGrid tree demo</title>
</svelte:head>

<svelte:window
	onmousemove={onWindowMouseMove}
	onmouseup={onWindowMouseUp}
	onkeydown={onWindowKeyDown}
/>

<main class="page-shell">
	<section class="workspace" aria-labelledby="svar-grid-title">
		<div class="header-row">
			<div class="title-block">
				<p class="eyebrow">Svelte 5 + SVAR DataGrid</p>
				<h1 id="svar-grid-title">SVAR DataGrid tree demo</h1>
				<p>
					Древовидная оргструктура, поиск по имени с сохранением родителей, инлайн-редакторы для
					текста, чисел и дат, а также выделение диапазона ячеек мышью с копированием по Ctrl/Cmd+C.
				</p>
			</div>

			<div class="metrics" aria-label="Статистика таблицы">
				<div>
					<span data-testid="visible-row-count">{visibleRows} из {totalRows}</span>
					<small>строк</small>
				</div>
				<div>
					<span data-testid="selected-cells">{selectionSummary?.cells ?? 0}</span>
					<small>ячеек выбрано</small>
				</div>
				<div>
					<span data-testid="selection-sum">
						{selectionSummary?.numericCells
							? numberFormatter.format(selectionSummary.sum)
							: '—'}
					</span>
					<small>сумма чисел</small>
				</div>
			</div>
		</div>

		<div class="toolbar" aria-label="Управление таблицей">
			<label class="filter-control">
				<span>Поиск по имени</span>
				<input
					type="search"
					bind:value={nameFilter}
					oninput={onFilterInput}
					placeholder="Например, Никита или Дизайн"
					autocomplete="off"
					data-testid="name-filter"
				/>
			</label>

			<div class="button-group">
				<button type="button" onclick={clearFilter} disabled={!nameFilter}>Сбросить</button>
				<button type="button" onclick={() => setExpanded(true)}>Раскрыть все</button>
				<button type="button" onclick={() => setExpanded(false)}>Свернуть все</button>
				<button type="button" onclick={copyRange} disabled={!rangeRows.length}>
					Копировать диапазон
				</button>
			</div>
		</div>

		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="grid-frame"
			class:is-dragging={dragging}
			data-testid="svar-grid-frame"
			onmousedown={onCellMouseDown}
		>
			{#if browser}
				<Willow>
					<Grid
						data={filteredData}
						{columns}
						{cellStyle}
						tree
						select={false}
						init={(api) => (gridApi = api)}
					/>
				</Willow>
			{/if}

			{#if visibleRows === 0}
				<div class="empty-state">Ничего не найдено по такому запросу</div>
			{/if}
		</div>
	</section>
</main>

<style>
	.page-shell {
		min-height: 100vh;
		background: #f7f8fb;
		color: #111827;
		padding: 28px;
	}

	.workspace {
		display: flex;
		min-height: calc(100vh - 56px);
		flex-direction: column;
		gap: 16px;
	}

	.header-row {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 24px;
	}

	.title-block {
		max-width: 760px;
	}

	.eyebrow {
		margin: 0 0 6px;
		color: #4338ca;
		font-size: 0.78rem;
		font-weight: 750;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		font-size: 2.35rem;
		font-weight: 760;
		line-height: 1.1;
	}

	p {
		margin: 8px 0 0;
		color: #5b6472;
		font-size: 0.96rem;
		line-height: 1.45;
	}

	.metrics {
		display: flex;
		gap: 10px;
	}

	.metrics div {
		display: grid;
		min-width: 112px;
		gap: 3px;
		border: 1px solid #d9e2ec;
		border-radius: 8px;
		background: #ffffff;
		padding: 10px 12px;
	}

	.metrics span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 1.05rem;
		font-weight: 760;
		line-height: 1.1;
	}

	.metrics small {
		color: #6b7280;
		font-size: 0.78rem;
	}

	.toolbar {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 16px;
		border: 1px solid #d9e2ec;
		border-radius: 8px;
		background: #ffffff;
		padding: 14px;
	}

	.filter-control {
		display: grid;
		width: min(100%, 360px);
		gap: 6px;
		color: #475569;
		font-size: 0.86rem;
		font-weight: 650;
	}

	.filter-control input {
		width: 100%;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		background: #ffffff;
		color: #111827;
		font: inherit;
		font-weight: 500;
		padding: 9px 11px;
	}

	.filter-control input:focus {
		border-color: #4f46e5;
		box-shadow: 0 0 0 3px rgb(79 70 229 / 16%);
		outline: none;
	}

	.button-group {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 8px;
	}

	button {
		min-height: 38px;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		background: #ffffff;
		color: #1f2937;
		cursor: pointer;
		font: inherit;
		font-size: 0.9rem;
		font-weight: 650;
		padding: 0 13px;
	}

	button:hover:not(:disabled) {
		border-color: #4f46e5;
		color: #4338ca;
	}

	button:disabled {
		color: #9ca3af;
		cursor: not-allowed;
	}

	.grid-frame {
		position: relative;
		min-height: 520px;
		flex: 1;
		overflow: hidden;
		border: 1px solid #d9e2ec;
		border-radius: 8px;
		background: #ffffff;
		user-select: none;
	}

	.grid-frame.is-dragging {
		cursor: cell;
	}

	.grid-frame :global(.wx-willow-theme) {
		height: 100%;
	}

	/* Highlight for the custom cell range selection. */
	.grid-frame :global(.svar-range-cell) {
		background: rgb(79 70 229 / 14%) !important;
		box-shadow: inset 0 0 0 1px rgb(79 70 229 / 35%);
	}

	.empty-state {
		position: absolute;
		top: 84px;
		left: 50%;
		z-index: 2;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		background: #ffffff;
		color: #4b5563;
		font-size: 0.94rem;
		font-weight: 650;
		padding: 12px 16px;
		transform: translateX(-50%);
	}

	@media (max-width: 760px) {
		.page-shell {
			padding: 16px;
		}

		.workspace {
			min-height: calc(100vh - 32px);
		}

		.header-row,
		.toolbar {
			align-items: stretch;
			flex-direction: column;
		}

		h1 {
			font-size: 1.85rem;
		}

		.metrics,
		.button-group {
			justify-content: flex-start;
		}

		.metrics {
			flex-wrap: wrap;
		}

		.filter-control {
			width: 100%;
		}
	}
</style>
