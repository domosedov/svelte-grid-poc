<script lang="ts">
	import {
		createSvelteTable,
		flexRender,
		getCoreRowModel,
		type Cell,
		type Column,
		type ColumnDef,
		type Row,
		type Table
	} from '@tanstack/svelte-table';
	import { SvelteSet } from 'svelte/reactivity';

	type Deal = {
		id: string;
		company: string;
		segment: string;
		region: string;
		arr: string;
		stage: string;
		owner: string;
	};

	type GridCell = {
		id: string;
		rowId: string;
		rowIndex: number;
		columnId: string;
		columnIndex: number;
		company: string;
		columnLabel: string;
		value: string;
		cell: Cell<Deal, unknown>;
	};

	const data: Deal[] = [
		{
			id: 'acme-analytics',
			company: 'Acme Analytics',
			segment: 'Enterprise',
			region: 'North America',
			arr: '$2.4M',
			stage: 'Negotiation',
			owner: 'Mira'
		},
		{
			id: 'northstar-payments',
			company: 'Northstar Payments',
			segment: 'Mid-market',
			region: 'Europe',
			arr: '$840K',
			stage: 'Proposal',
			owner: 'Anton'
		},
		{
			id: 'vector-logistics',
			company: 'Vector Logistics',
			segment: 'Enterprise',
			region: 'APAC',
			arr: '$1.7M',
			stage: 'Discovery',
			owner: 'Leah'
		},
		{
			id: 'orbit-clinic',
			company: 'Orbit Clinic',
			segment: 'SMB',
			region: 'Europe',
			arr: '$310K',
			stage: 'Qualified',
			owner: 'Niko'
		},
		{
			id: 'zenith-cloud',
			company: 'Zenith Cloud',
			segment: 'Enterprise',
			region: 'Latin America',
			arr: '$3.1M',
			stage: 'Security review',
			owner: 'Sara'
		},
		{
			id: 'craft-retail',
			company: 'Craft Retail',
			segment: 'Mid-market',
			region: 'North America',
			arr: '$620K',
			stage: 'Procurement',
			owner: 'Oleg'
		}
	];

	const columns: ColumnDef<Deal>[] = [
		{
			accessorKey: 'company',
			header: 'Company',
			cell: (info) => info.getValue()
		},
		{
			accessorKey: 'segment',
			header: 'Segment',
			cell: (info) => info.getValue()
		},
		{
			accessorKey: 'region',
			header: 'Region',
			cell: (info) => info.getValue()
		},
		{
			accessorKey: 'arr',
			header: 'ARR',
			cell: (info) => info.getValue()
		},
		{
			accessorKey: 'stage',
			header: 'Stage',
			cell: (info) => info.getValue()
		},
		{
			accessorKey: 'owner',
			header: 'Owner',
			cell: (info) => info.getValue()
		}
	];

	const table = createSvelteTable<Deal>({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getRowId: (row) => row.id
	});

	const selectedRows = new SvelteSet<string>();
	const selectedColumns = new SvelteSet<string>();
	const selectedCells = new SvelteSet<string>();

	let anchorCellId = $state<string | null>(null);
	let dragAnchorCellId = $state<string | null>(null);
	let hoveredCellId = $state<string | null>(null);
	let isDragging = $state(false);
	let dragSelectionChanged = $state(false);
	let suppressNextClick = $state(false);

	function renderText(content: unknown) {
		return content == null ? '' : String(content);
	}

	function getColumnLabel(column: Column<Deal, unknown>) {
		const header = column.columnDef.header;

		return typeof header === 'string' && header ? header : column.id;
	}

	function getHeaderText(column: Column<Deal, unknown>) {
		return getColumnLabel(column);
	}

	function getCellText(cell: Cell<Deal, unknown>) {
		return renderText(flexRender(cell.column.columnDef.cell, cell.getContext()));
	}

	function getGridTemplate(tableInstance: Table<Deal>) {
		return `grid-template-columns: 4rem repeat(${tableInstance.getAllLeafColumns().length}, minmax(9rem, 1fr));`;
	}

	function getGridCells(tableInstance: Table<Deal>) {
		return tableInstance.getRowModel().rows.flatMap((row, rowIndex) =>
			row.getVisibleCells().map((cell, columnIndex) => ({
				id: cell.id,
				rowId: row.id,
				rowIndex,
				columnId: cell.column.id,
				columnIndex,
				company: row.original.company,
				columnLabel: getColumnLabel(cell.column),
				value: getCellText(cell),
				cell
			}))
		);
	}

	function getGridCellsByRow(row: Row<Deal>, rowIndex: number) {
		return row.getVisibleCells().map((cell, columnIndex) => ({
			id: cell.id,
			rowId: row.id,
			rowIndex,
			columnId: cell.column.id,
			columnIndex,
			company: row.original.company,
			columnLabel: getColumnLabel(cell.column),
			value: getCellText(cell),
			cell
		}));
	}

	function getCellById(tableInstance: Table<Deal>, cellId: string) {
		return getGridCells(tableInstance).find((cell) => cell.id === cellId);
	}

	function replaceSet<T>(target: SvelteSet<T>, values: Iterable<T>) {
		target.clear();

		for (const value of values) {
			target.add(value);
		}
	}

	function clearRowsAndColumns() {
		selectedRows.clear();
		selectedColumns.clear();
	}

	function selectOnlyCells(cellIds: Iterable<string>) {
		clearRowsAndColumns();
		replaceSet(selectedCells, cellIds);
	}

	function getRangeCellIds(tableInstance: Table<Deal>, startCellId: string, endCellId: string) {
		const start = getCellById(tableInstance, startCellId);
		const end = getCellById(tableInstance, endCellId);

		if (!start || !end) return [];

		const rowStart = Math.min(start.rowIndex, end.rowIndex);
		const rowEnd = Math.max(start.rowIndex, end.rowIndex);
		const columnStart = Math.min(start.columnIndex, end.columnIndex);
		const columnEnd = Math.max(start.columnIndex, end.columnIndex);

		return getGridCells(tableInstance)
			.filter(
				(cell) =>
					cell.rowIndex >= rowStart &&
					cell.rowIndex <= rowEnd &&
					cell.columnIndex >= columnStart &&
					cell.columnIndex <= columnEnd
			)
			.map((cell) => cell.id);
	}

	function selectRange(tableInstance: Table<Deal>, startCellId: string, endCellId: string) {
		selectOnlyCells(getRangeCellIds(tableInstance, startCellId, endCellId));
	}

	function selectSingleCell(gridCell: GridCell) {
		selectOnlyCells([gridCell.id]);
		anchorCellId = gridCell.id;
	}

	function selectRow(row: Row<Deal>, rowIndex: number) {
		selectedRows.clear();
		selectedRows.add(row.id);
		selectedColumns.clear();
		replaceSet(
			selectedCells,
			getGridCellsByRow(row, rowIndex).map((cell) => cell.id)
		);
		anchorCellId = getGridCellsByRow(row, rowIndex)[0]?.id ?? null;
	}

	function selectColumn(tableInstance: Table<Deal>, column: Column<Deal, unknown>) {
		selectedRows.clear();
		selectedColumns.clear();
		selectedColumns.add(column.id);
		replaceSet(
			selectedCells,
			getGridCells(tableInstance)
				.filter((cell) => cell.columnId === column.id)
				.map((cell) => cell.id)
		);
		anchorCellId =
			getGridCells(tableInstance).find((cell) => cell.columnId === column.id)?.id ?? null;
	}

	function selectAllColumns(tableInstance: Table<Deal>) {
		replaceSet(
			selectedColumns,
			tableInstance.getAllLeafColumns().map((column) => column.id)
		);
		selectedRows.clear();
		replaceSet(
			selectedCells,
			getGridCells(tableInstance).map((cell) => cell.id)
		);
		anchorCellId = getGridCells(tableInstance)[0]?.id ?? null;
	}

	function selectAllCells(tableInstance: Table<Deal>) {
		clearRowsAndColumns();
		replaceSet(
			selectedCells,
			getGridCells(tableInstance).map((cell) => cell.id)
		);
		anchorCellId = getGridCells(tableInstance)[0]?.id ?? null;
	}

	function clearSelection() {
		selectedRows.clear();
		selectedColumns.clear();
		selectedCells.clear();
		anchorCellId = null;
		dragAnchorCellId = null;
		hoveredCellId = null;
		isDragging = false;
		dragSelectionChanged = false;
		suppressNextClick = false;
	}

	function handleCellMouseDown(event: MouseEvent, tableInstance: Table<Deal>, gridCell: GridCell) {
		if (event.button !== 0 || event.shiftKey) return;

		event.preventDefault();
		dragAnchorCellId = gridCell.id;
		anchorCellId = gridCell.id;
		isDragging = true;
		dragSelectionChanged = false;
		selectRange(tableInstance, gridCell.id, gridCell.id);
	}

	function handleCellMouseEnter(tableInstance: Table<Deal>, gridCell: GridCell) {
		hoveredCellId = gridCell.id;

		if (!isDragging || !dragAnchorCellId) return;

		dragSelectionChanged = dragAnchorCellId !== gridCell.id;
		selectRange(tableInstance, dragAnchorCellId, gridCell.id);
	}

	function handleCellMouseLeave(gridCell: GridCell) {
		if (hoveredCellId === gridCell.id) {
			hoveredCellId = null;
		}
	}

	function handleCellClick(event: MouseEvent, tableInstance: Table<Deal>, gridCell: GridCell) {
		if (suppressNextClick) {
			suppressNextClick = false;
			return;
		}

		if (event.shiftKey && anchorCellId) {
			selectRange(tableInstance, anchorCellId, gridCell.id);
			return;
		}

		selectSingleCell(gridCell);
	}

	function handleCellKeydown(event: KeyboardEvent, tableInstance: Table<Deal>, gridCell: GridCell) {
		if (event.key !== 'Enter' && event.key !== ' ') return;

		event.preventDefault();

		if (event.shiftKey && anchorCellId) {
			selectRange(tableInstance, anchorCellId, gridCell.id);
			return;
		}

		selectSingleCell(gridCell);
	}

	function finishDrag() {
		if (!isDragging) return;

		suppressNextClick = dragSelectionChanged;
		isDragging = false;
		dragAnchorCellId = null;
		dragSelectionChanged = false;
	}

	function getCellLabel(gridCell: GridCell) {
		return `${gridCell.company} ${gridCell.columnLabel} ${gridCell.value}`;
	}

	function isRowSelected(rowId: string) {
		return selectedRows.has(rowId);
	}

	function isColumnSelected(columnId: string) {
		return selectedColumns.has(columnId);
	}

	function isCellSelected(cellId: string) {
		return selectedCells.has(cellId);
	}

	function isCellHovered(cellId: string) {
		return hoveredCellId === cellId;
	}
</script>

<svelte:window onmouseup={finishDrag} />

<svelte:head>
	<title>TanStack grid selection demo</title>
</svelte:head>

<main class="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-950 sm:px-6 lg:px-8">
	<section class="mx-auto flex max-w-7xl flex-col gap-5">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p class="text-sm font-medium text-teal-700">Svelte 5 + @tanstack/svelte-table</p>
				<h1 class="mt-1 text-3xl font-semibold tracking-normal">TanStack grid selection demo</h1>
			</div>

			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					class="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:border-zinc-400 focus:ring-2 focus:ring-teal-500 focus:outline-none"
					onclick={() => selectAllColumns($table)}
				>
					Выбрать все колонки
				</button>
				<button
					type="button"
					class="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:border-zinc-400 focus:ring-2 focus:ring-teal-500 focus:outline-none"
					onclick={() => selectAllCells($table)}
				>
					Выбрать все ячейки
				</button>
				<button
					type="button"
					class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 shadow-sm hover:border-red-300 focus:ring-2 focus:ring-red-400 focus:outline-none"
					onclick={clearSelection}
				>
					Очистить выбор
				</button>
			</div>
		</div>

		<div class="grid gap-3 md:grid-cols-3" aria-label="Selection counters">
			<div class="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
				<p class="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Rows</p>
				<p class="mt-2 text-2xl font-semibold" data-testid="selected-rows-count">
					{selectedRows.size}
				</p>
			</div>
			<div class="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
				<p class="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Columns</p>
				<p class="mt-2 text-2xl font-semibold" data-testid="selected-columns-count">
					{selectedColumns.size}
				</p>
			</div>
			<div class="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
				<p class="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Cells</p>
				<p class="mt-2 text-2xl font-semibold" data-testid="selected-cells-count">
					{selectedCells.size}
				</p>
			</div>
		</div>

		<div class="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
			<div class="overflow-x-auto">
				<div
					role="grid"
					class="min-w-max select-none"
					aria-label="Deals selection grid"
					aria-rowcount={$table.getRowModel().rows.length + 1}
					aria-colcount={$table.getAllLeafColumns().length + 1}
				>
					<div role="row" class="grid bg-zinc-50" style={getGridTemplate($table)} aria-rowindex="1">
						<div
							role="columnheader"
							class="border-r border-b border-zinc-200 px-3 py-3 text-xs font-semibold text-zinc-400"
							aria-colindex="1"
							aria-label="Row selectors"
						>
							#
						</div>
						{#each $table.getAllLeafColumns() as column, columnIndex (column.id)}
							{@const columnSelected = isColumnSelected(column.id)}
							<div
								role="columnheader"
								tabindex="0"
								class={[
									'cursor-cell border-r border-b border-zinc-200 px-3 py-3 text-left text-xs font-semibold tracking-wide text-zinc-600 uppercase transition-colors outline-none',
									columnSelected
										? 'bg-sky-100 text-sky-900 ring-1 ring-sky-400 ring-inset'
										: 'hover:bg-sky-50 focus:bg-sky-50 focus:ring-1 focus:ring-sky-300 focus:ring-inset'
								]}
								aria-colindex={columnIndex + 2}
								aria-selected={columnSelected}
								aria-label={`Выбрать колонку ${getColumnLabel(column)}`}
								data-selected-column={columnSelected ? 'true' : 'false'}
								onclick={() => selectColumn($table, column)}
								onkeydown={(event) => {
									if (event.key === 'Enter' || event.key === ' ') {
										event.preventDefault();
										selectColumn($table, column);
									}
								}}
							>
								{getHeaderText(column)}
							</div>
						{/each}
					</div>

					{#each $table.getRowModel().rows as row, rowIndex (row.id)}
						{@const rowSelected = isRowSelected(row.id)}
						<div
							role="row"
							class="grid bg-white"
							style={getGridTemplate($table)}
							aria-rowindex={rowIndex + 2}
							data-selected-row={rowSelected ? 'true' : 'false'}
						>
							<div
								role="rowheader"
								tabindex="0"
								class={[
									'cursor-cell border-r border-b border-zinc-200 px-3 py-2 text-sm font-medium transition-colors outline-none',
									rowSelected
										? 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-400 ring-inset'
										: 'bg-zinc-50 text-zinc-700 hover:bg-emerald-50 focus:bg-emerald-50 focus:ring-1 focus:ring-emerald-300 focus:ring-inset'
								]}
								aria-colindex="1"
								aria-selected={rowSelected}
								aria-label={`Выбрать строку ${row.original.company}`}
								onclick={() => selectRow(row, rowIndex)}
								onkeydown={(event) => {
									if (event.key === 'Enter' || event.key === ' ') {
										event.preventDefault();
										selectRow(row, rowIndex);
									}
								}}
							>
								{rowIndex + 1}
							</div>

							{#each getGridCellsByRow(row, rowIndex) as gridCell (gridCell.id)}
								{@const cellSelected = isCellSelected(gridCell.id)}
								{@const cellHovered = isCellHovered(gridCell.id)}
								<div
									role="gridcell"
									tabindex="0"
									class={[
										'min-h-11 cursor-cell border-r border-b border-zinc-200 px-3 py-2 text-sm text-zinc-800 transition-colors outline-none',
										cellSelected &&
											'bg-sky-100 text-sky-950 ring-2 ring-sky-500 ring-inset hover:bg-sky-100',
										!cellSelected && cellHovered && 'bg-sky-50 ring-1 ring-sky-200 ring-inset',
										!cellSelected && !cellHovered && 'hover:bg-sky-50 focus:bg-sky-50',
										anchorCellId === gridCell.id && 'shadow-[inset_0_0_0_2px_rgb(5,150,105)]'
									]}
									aria-colindex={gridCell.columnIndex + 2}
									aria-selected={cellSelected}
									aria-label={getCellLabel(gridCell)}
									data-cell-id={gridCell.id}
									data-selected-cell={cellSelected ? 'true' : 'false'}
									data-hovered-cell={cellHovered ? 'true' : 'false'}
									onmousedown={(event) => handleCellMouseDown(event, $table, gridCell)}
									onmouseenter={() => handleCellMouseEnter($table, gridCell)}
									onmouseleave={() => handleCellMouseLeave(gridCell)}
									onclick={(event) => handleCellClick(event, $table, gridCell)}
									onkeydown={(event) => handleCellKeydown(event, $table, gridCell)}
								>
									{gridCell.value}
								</div>
							{/each}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>
</main>
