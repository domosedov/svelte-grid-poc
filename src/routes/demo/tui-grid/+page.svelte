<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import type { ColumnOptions, FilterState } from 'tui-grid';
	import 'tui-grid/dist/tui-grid.css';

	import {
		buildNameFilterState,
		countTreeRows,
		createTreeRows,
		type DemoTreeRow
	} from './demo-data';

	type TuiGridConstructor = typeof import('tui-grid').default;
	type TuiGridInstance = InstanceType<TuiGridConstructor>;

	const DATA_OPTIONS = {
		groupCount: 4,
		childrenPerGroup: 6
	};
	const INITIAL_SEED = 2026;
	const initialRows = createTreeRows({ seed: INITIAL_SEED, ...DATA_OPTIONS });

	const columns: ColumnOptions[] = [
		{
			header: 'Name',
			name: 'name',
			width: 260,
			filter: 'text',
			editor: 'text'
		},
		{
			header: 'Email',
			name: 'email',
			width: 230,
			editor: 'text'
		},
		{
			header: 'Role',
			name: 'role',
			width: 170,
			editor: 'text'
		},
		{
			header: 'Status',
			name: 'status',
			width: 120,
			editor: 'text'
		},
		{
			header: 'Budget',
			name: 'budget',
			align: 'right',
			width: 130,
			editor: 'text'
		},
		{
			header: 'Created',
			name: 'createdAt',
			width: 120,
			editor: 'text'
		}
	];

	let grid: TuiGridInstance | null = null;
	let seed = $state(INITIAL_SEED);
	let nameFilter = $state('');
	let rows = $state.raw<DemoTreeRow[]>(initialRows);

	let rowCount = $derived(countTreeRows(rows));
	let groupCount = $derived(rows.length);

	function getGridData() {
		return rows;
	}

	/** Записать отредактированное значение обратно в модель строк (дерево) по id. */
	function updateRowValue(id: string, columnName: string, value: string) {
		const apply = (list: DemoTreeRow[]): DemoTreeRow[] =>
			list.map((row) => {
				if (row.id === id) {
					return { ...row, [columnName]: value };
				}

				if (row._children) {
					return { ...row, _children: apply(row._children) };
				}

				return row;
			});

		rows = apply(rows);
	}

	type GridChange = { rowKey: string | number; columnName: string; value: unknown };

	function handleAfterChange(event: { changes?: GridChange[] }) {
		for (const change of event.changes ?? []) {
			updateRowValue(
				String(change.rowKey),
				change.columnName,
				change.value == null ? '' : String(change.value)
			);
		}
	}

	function applyNameFilter(value = nameFilter) {
		if (!grid) {
			return;
		}

		const filterState = buildNameFilterState(value);

		if (filterState.length > 0) {
			grid.filter('name', filterState as FilterState[]);
			grid.expandAll();
		} else {
			grid.unfilter('name');
		}
	}

	function handleNameFilterInput(event: Event) {
		if (!(event.currentTarget instanceof HTMLInputElement)) {
			return;
		}

		nameFilter = event.currentTarget.value;
		applyNameFilter(nameFilter);
	}

	function clearFilter() {
		nameFilter = '';
		applyNameFilter();
	}

	function expandAll() {
		grid?.expandAll();
	}

	function collapseAll() {
		grid?.collapseAll();
	}

	function regenerateRows() {
		seed += 1;
		rows = createTreeRows({ seed, ...DATA_OPTIONS });
		grid?.resetData(getGridData());
		applyNameFilter();
		grid?.expandAll();
		grid?.refreshLayout();
	}

	const tuiGrid: Attachment<HTMLDivElement> = (node) => {
		let destroyed = false;

		const refreshLayout = () => {
			grid?.refreshLayout();
		};

		void import('tui-grid').then(({ default: Grid }) => {
			if (destroyed) {
				return;
			}

			Grid.applyTheme('clean', {
				cell: {
					header: {
						background: '#f8fafc',
						border: '#dbe3ee',
						text: '#334155'
					},
					normal: {
						background: '#ffffff',
						border: '#e5e7eb',
						text: '#0f172a'
					},
					rowHeader: {
						background: '#f8fafc',
						border: '#dbe3ee',
						text: '#475569'
					},
					selectedHeader: {
						background: '#e0f2fe'
					},
					selectedRowHeader: {
						background: '#e0f2fe'
					}
				}
			});

			grid = new Grid({
				el: node,
				data: initialRows,
				columns,
				keyColumnName: 'id',
				bodyHeight: 'fitToParent',
				rowHeight: 42,
				minRowHeight: 42,
				scrollX: true,
				scrollY: true,
				rowHeaders: ['rowNum'],
				columnOptions: {
					resizable: true,
					minWidth: 100
				},
				treeColumnOptions: {
					name: 'name',
					useIcon: true,
					indentWidth: 24
				},
				usageStatistics: false
			});

			grid.expandAll();
			grid.on('afterChange', handleAfterChange as (ev: unknown) => void);
			window.addEventListener('resize', refreshLayout);
			requestAnimationFrame(refreshLayout);
		});

		return () => {
			destroyed = true;
			window.removeEventListener('resize', refreshLayout);
			grid?.destroy();
			grid = null;
		};
	};
</script>

<svelte:head>
	<title>TUI Grid tree demo</title>
</svelte:head>

<main class="page-shell">
	<section class="workspace" aria-labelledby="tui-grid-title">
		<div class="header-row">
			<div>
				<p class="eyebrow">Demo</p>
				<h1 id="tui-grid-title">TUI Grid tree demo</h1>
				<p class="hint">Двойной клик по ячейке — редактирование значения.</p>
			</div>

			<div class="metrics" aria-label="Tree grid statistics">
				<div>
					<span>{rowCount}</span>
					<small>строк</small>
				</div>
				<div>
					<span>{groupCount}</span>
					<small>группы</small>
				</div>
			</div>
		</div>

		<div class="toolbar" aria-label="Grid controls">
			<label class="filter-control">
				<span>Фильтр по имени</span>
				<input
					type="search"
					value={nameFilter}
					oninput={handleNameFilterInput}
					placeholder="Имя сотрудника"
					autocomplete="off"
				/>
			</label>

			<div class="button-group">
				<button type="button" onclick={clearFilter} disabled={!nameFilter}>Сбросить фильтр</button>
				<button type="button" onclick={expandAll}>Раскрыть все</button>
				<button type="button" onclick={collapseAll}>Свернуть все</button>
				<button type="button" class="primary" onclick={regenerateRows}>Сгенерировать</button>
			</div>
		</div>

		<div class="grid-frame">
			<div class="grid-target" {@attach tuiGrid}></div>
		</div>
	</section>
</main>

<style>
	.page-shell {
		min-height: 100vh;
		background: #f6f8fb;
		color: #111827;
		padding: 32px;
	}

	.workspace {
		display: flex;
		min-height: calc(100vh - 64px);
		flex-direction: column;
		gap: 18px;
	}

	.header-row {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 24px;
	}

	.eyebrow {
		margin: 0 0 6px;
		color: #047857;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		font-size: clamp(1.8rem, 3vw, 2.65rem);
		font-weight: 750;
		letter-spacing: 0;
	}

	.hint {
		margin: 8px 0 0;
		color: #64748b;
		font-size: 0.86rem;
	}

	.metrics {
		display: flex;
		gap: 10px;
	}

	.metrics div {
		display: grid;
		min-width: 88px;
		gap: 2px;
		border: 1px solid #d9e2ec;
		border-radius: 8px;
		background: #ffffff;
		padding: 10px 12px;
	}

	.metrics span {
		font-size: 1.25rem;
		font-weight: 750;
		line-height: 1;
	}

	.metrics small {
		color: #64748b;
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
		color: #0f172a;
		font: inherit;
		font-weight: 500;
		padding: 9px 11px;
	}

	.filter-control input:focus {
		border-color: #0891b2;
		box-shadow: 0 0 0 3px rgb(8 145 178 / 16%);
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
		color: #1e293b;
		cursor: pointer;
		font: inherit;
		font-size: 0.9rem;
		font-weight: 650;
		padding: 0 13px;
	}

	button:hover:not(:disabled) {
		border-color: #0891b2;
		color: #0e7490;
	}

	button:disabled {
		color: #94a3b8;
		cursor: not-allowed;
	}

	button.primary {
		border-color: #0f766e;
		background: #0f766e;
		color: #ffffff;
	}

	button.primary:hover {
		border-color: #115e59;
		background: #115e59;
		color: #ffffff;
	}

	.grid-frame {
		min-height: 460px;
		flex: 1;
		overflow: hidden;
		border: 1px solid #d9e2ec;
		border-radius: 8px;
		background: #ffffff;
	}

	.grid-target {
		height: 100%;
		min-height: 460px;
	}

	:global(.tui-grid-container) {
		font-family:
			Inter,
			ui-sans-serif,
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
	}

	:global(.tui-grid-cell-content) {
		font-size: 13px;
	}

	:global(.tui-grid-cell-has-tree .tui-grid-cell-content) {
		font-weight: 650;
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

		.metrics,
		.button-group {
			justify-content: flex-start;
		}

		.filter-control {
			width: 100%;
		}
	}
</style>
