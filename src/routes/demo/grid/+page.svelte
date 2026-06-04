<script lang="ts">
	import {
		createTable,
		FlexRender,
		tableFeatures,
		columnVisibilityFeature,
		type Cell,
		type Column,
		type ColumnDef,
		type Row,
		type Table
	} from '@tanstack/svelte-table';
	import { SvelteSet } from 'svelte/reactivity';

	const features = tableFeatures({ columnVisibilityFeature });
	type Features = typeof features;

	type CellType = 'text' | 'number' | 'date';

	type Deal = {
		id: string;
		company: string;
		segment: string;
		region: string;
		arr: string;
		seats: number;
		stage: string;
		owner: string;
		closeDate: string;
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
		cell: Cell<Features, Deal, unknown>;
	};

	const initialData: Deal[] = [
		{
			id: 'acme-analytics',
			company: 'Acme Analytics',
			segment: 'Enterprise',
			region: 'North America',
			arr: '$2.4M',
			seats: 1200,
			stage: 'Negotiation',
			owner: 'Mira',
			closeDate: '2026-03-15'
		},
		{
			id: 'northstar-payments',
			company: 'Northstar Payments',
			segment: 'Mid-market',
			region: 'Europe',
			arr: '$840K',
			seats: 320,
			stage: 'Proposal',
			owner: 'Anton',
			closeDate: '2026-04-02'
		},
		{
			id: 'vector-logistics',
			company: 'Vector Logistics',
			segment: 'Enterprise',
			region: 'APAC',
			arr: '$1.7M',
			seats: 870,
			stage: 'Discovery',
			owner: 'Leah',
			closeDate: '2026-05-20'
		},
		{
			id: 'orbit-clinic',
			company: 'Orbit Clinic',
			segment: 'SMB',
			region: 'Europe',
			arr: '$310K',
			seats: 95,
			stage: 'Qualified',
			owner: 'Niko',
			closeDate: '2026-02-28'
		},
		{
			id: 'zenith-cloud',
			company: 'Zenith Cloud',
			segment: 'Enterprise',
			region: 'Latin America',
			arr: '$3.1M',
			seats: 1540,
			stage: 'Security review',
			owner: 'Sara',
			closeDate: '2026-06-10'
		},
		{
			id: 'craft-retail',
			company: 'Craft Retail',
			segment: 'Mid-market',
			region: 'North America',
			arr: '$620K',
			seats: 240,
			stage: 'Procurement',
			owner: 'Oleg',
			closeDate: '2026-03-30'
		}
	];

	let data = $state<Deal[]>(initialData.map((row) => ({ ...row })));

	const columnTypes: Record<string, CellType> = {
		company: 'text',
		segment: 'text',
		region: 'text',
		arr: 'text',
		seats: 'number',
		stage: 'text',
		owner: 'text',
		closeDate: 'date'
	};

	function getColumnType(columnId: string): CellType {
		return columnTypes[columnId] ?? 'text';
	}

	const numberFormatter = new Intl.NumberFormat('ru-RU');
	const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});

	function formatNumber(value: unknown) {
		const numeric = Number(value);
		return Number.isFinite(numeric) ? numberFormatter.format(numeric) : renderText(value);
	}

	function formatDate(value: unknown) {
		if (typeof value !== 'string' || value === '') return renderText(value);
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? value : dateFormatter.format(parsed);
	}

	/** Convert a raw edited/pasted string into the value stored for a column. */
	function coerceValue(columnId: string, raw: string): string | number {
		if (getColumnType(columnId) === 'number') {
			const trimmed = raw.trim();
			if (trimmed === '') return 0;
			const numeric = Number(trimmed.replace(/[^\d.-]/g, ''));
			return Number.isNaN(numeric) ? raw : numeric;
		}

		return raw;
	}

	const columns: ColumnDef<Features, Deal>[] = [
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
			accessorKey: 'seats',
			header: 'Seats',
			cell: (info) => formatNumber(info.getValue())
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
		},
		{
			accessorKey: 'closeDate',
			header: 'Close date',
			cell: (info) => formatDate(info.getValue())
		}
	];

	const table = createTable<Features, Deal>({
		_features: features,
		get data() {
			return data;
		},
		columns,
		getRowId: (row) => row.id
	});

	const selectedRows = new SvelteSet<string>();
	const selectedColumns = new SvelteSet<string>();
	const selectedCells = new SvelteSet<string>();

	let anchorCellId = $state<string | null>(null);
	let activeCellId = $state<string | null>(null);
	let dragAnchorCellId = $state<string | null>(null);
	let hoveredCellId = $state<string | null>(null);
	let isDragging = $state(false);
	let dragSelectionChanged = $state(false);
	let suppressNextClick = $state(false);

	let editingCellId = $state<string | null>(null);
	let editingValue = $state('');
	let gridEl = $state<HTMLElement | null>(null);

	function renderText(content: unknown) {
		return content == null ? '' : String(content);
	}

	function getColumnLabel(column: Column<Features, Deal, unknown>) {
		const header = column.columnDef.header;

		return typeof header === 'string' && header ? header : column.id;
	}

	function getHeaderText(column: Column<Features, Deal, unknown>) {
		return getColumnLabel(column);
	}

	function getCellText(cell: Cell<Features, Deal, unknown>) {
		return renderText(cell.renderValue());
	}

	function getGridTemplate(tableInstance: Table<Features, Deal>) {
		return `grid-template-columns: 4rem repeat(${tableInstance.getAllLeafColumns().length}, minmax(9rem, 1fr));`;
	}

	function getGridCells(tableInstance: Table<Features, Deal>) {
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

	function getGridCellsByRow(row: Row<Features, Deal>, rowIndex: number) {
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

	function getCellById(tableInstance: Table<Features, Deal>, cellId: string) {
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

	function getRangeCellIds(
		tableInstance: Table<Features, Deal>,
		startCellId: string,
		endCellId: string
	) {
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

	function selectRange(
		tableInstance: Table<Features, Deal>,
		startCellId: string,
		endCellId: string
	) {
		selectOnlyCells(getRangeCellIds(tableInstance, startCellId, endCellId));
	}

	function selectSingleCell(gridCell: GridCell) {
		selectOnlyCells([gridCell.id]);
		anchorCellId = gridCell.id;
		activeCellId = gridCell.id;
	}

	function selectRow(row: Row<Features, Deal>, rowIndex: number) {
		selectedRows.clear();
		selectedRows.add(row.id);
		selectedColumns.clear();
		replaceSet(
			selectedCells,
			getGridCellsByRow(row, rowIndex).map((cell) => cell.id)
		);
		anchorCellId = getGridCellsByRow(row, rowIndex)[0]?.id ?? null;
	}

	function selectColumn(
		tableInstance: Table<Features, Deal>,
		column: Column<Features, Deal, unknown>
	) {
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

	function selectAllColumns(tableInstance: Table<Features, Deal>) {
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

	function selectAllCells(tableInstance: Table<Features, Deal>) {
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
		activeCellId = null;
		dragAnchorCellId = null;
		hoveredCellId = null;
		isDragging = false;
		dragSelectionChanged = false;
		suppressNextClick = false;
		editingCellId = null;
	}

	let statusMessage = $state<string | null>(null);
	let statusTimeout: ReturnType<typeof setTimeout> | null = null;

	function flashStatus(message: string) {
		statusMessage = message;

		if (statusTimeout) clearTimeout(statusTimeout);
		statusTimeout = setTimeout(() => {
			statusMessage = null;
		}, 1800);
	}

	function getSelectedGridCells() {
		return getGridCells(table).filter((cell) => selectedCells.has(cell.id));
	}

	function getSelectionBounds(cells: GridCell[]) {
		let rowMin = Infinity;
		let rowMax = -Infinity;
		let columnMin = Infinity;
		let columnMax = -Infinity;

		for (const cell of cells) {
			rowMin = Math.min(rowMin, cell.rowIndex);
			rowMax = Math.max(rowMax, cell.rowIndex);
			columnMin = Math.min(columnMin, cell.columnIndex);
			columnMax = Math.max(columnMax, cell.columnIndex);
		}

		return { rowMin, rowMax, columnMin, columnMax };
	}

	function parseClipboard(text: string) {
		const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n$/, '');

		if (normalized === '') return [];

		return normalized.split('\n').map((line) => line.split('\t'));
	}

	async function copySelection() {
		const cells = getSelectedGridCells();

		if (cells.length === 0) return;

		const { rowMin, rowMax, columnMin, columnMax } = getSelectionBounds(cells);
		const valueByKey = new Map(
			cells.map((cell) => [`${cell.rowIndex}:${cell.columnIndex}`, cell.value])
		);

		const lines: string[] = [];
		for (let rowIndex = rowMin; rowIndex <= rowMax; rowIndex++) {
			const columnValues: string[] = [];
			for (let columnIndex = columnMin; columnIndex <= columnMax; columnIndex++) {
				columnValues.push(valueByKey.get(`${rowIndex}:${columnIndex}`) ?? '');
			}
			lines.push(columnValues.join('\t'));
		}

		try {
			await navigator.clipboard.writeText(lines.join('\n'));
			flashStatus(`Скопировано ячеек: ${cells.length}`);
		} catch {
			flashStatus('Не удалось скопировать в буфер обмена');
		}
	}

	async function pasteSelection() {
		let text = '';

		try {
			text = await navigator.clipboard.readText();
		} catch {
			flashStatus('Нет доступа к буферу обмена');
			return;
		}

		const matrix = parseClipboard(text);
		if (matrix.length === 0) return;

		const selected = getSelectedGridCells();
		let startRow: number;
		let startColumn: number;

		if (selected.length > 0) {
			const bounds = getSelectionBounds(selected);
			startRow = bounds.rowMin;
			startColumn = bounds.columnMin;
		} else {
			const anchor = anchorCellId ? getCellById(table, anchorCellId) : undefined;
			if (!anchor) return;
			startRow = anchor.rowIndex;
			startColumn = anchor.columnIndex;
		}

		const columnIds = table.getAllLeafColumns().map((column) => column.id);
		const rows = table.getRowModel().rows;
		const next = data.map((row) => ({ ...row }));
		const pastedCellIds: string[] = [];

		for (let r = 0; r < matrix.length; r++) {
			const targetRowIndex = startRow + r;
			if (targetRowIndex >= rows.length) break;

			const rowId = rows[targetRowIndex].id;
			const dataIndex = next.findIndex((row) => row.id === rowId);
			if (dataIndex === -1) continue;

			for (let c = 0; c < matrix[r].length; c++) {
				const targetColumnIndex = startColumn + c;
				if (targetColumnIndex >= columnIds.length) break;

				const columnId = columnIds[targetColumnIndex];
				(next[dataIndex] as Record<string, string | number>)[columnId] = coerceValue(
					columnId,
					matrix[r][c]
				);
				pastedCellIds.push(`${rowId}_${columnId}`);
			}
		}

		if (pastedCellIds.length === 0) return;

		data = next;
		selectOnlyCells(pastedCellIds);
		anchorCellId = pastedCellIds[0];
		flashStatus(`Вставлено ячеек: ${pastedCellIds.length}`);
	}

	function getColumnCount() {
		return table.getAllLeafColumns().length;
	}

	function getRowCount() {
		return table.getRowModel().rows.length;
	}

	function getCellByCoords(rowIndex: number, columnIndex: number) {
		return getGridCells(table).find(
			(cell) => cell.rowIndex === rowIndex && cell.columnIndex === columnIndex
		);
	}

	function clamp(value: number, min: number, max: number) {
		return Math.max(min, Math.min(max, value));
	}

	function focusCell(cellId: string) {
		requestAnimationFrame(() => {
			const el = gridEl?.querySelector<HTMLElement>(`[data-cell-id="${cellId}"]`);
			el?.focus();
			el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
		});
	}

	/** Move the active cell by a delta. With `extend`, grows the range from the anchor. */
	function moveActive(rowDelta: number, columnDelta: number, extend: boolean) {
		const current = activeCellId ? getCellById(table, activeCellId) : undefined;
		if (!current) return;

		const targetRow = clamp(current.rowIndex + rowDelta, 0, getRowCount() - 1);
		const targetColumn = clamp(current.columnIndex + columnDelta, 0, getColumnCount() - 1);
		const target = getCellByCoords(targetRow, targetColumn);
		if (!target) return;

		if (extend && anchorCellId) {
			selectRange(table, anchorCellId, target.id);
			activeCellId = target.id;
		} else {
			selectSingleCell(target);
		}

		focusCell(target.id);
	}

	function moveActiveTo(rowIndex: number, columnIndex: number, extend: boolean) {
		const target = getCellByCoords(
			clamp(rowIndex, 0, getRowCount() - 1),
			clamp(columnIndex, 0, getColumnCount() - 1)
		);
		if (!target) return;

		if (extend && anchorCellId) {
			selectRange(table, anchorCellId, target.id);
			activeCellId = target.id;
		} else {
			selectSingleCell(target);
		}

		focusCell(target.id);
	}

	function startEditing(gridCell: GridCell, initial?: string) {
		selectSingleCell(gridCell);
		editingCellId = gridCell.id;
		editingValue = initial ?? gridCell.value;

		requestAnimationFrame(() => {
			const input = gridEl?.querySelector<HTMLInputElement>(
				`[data-cell-id="${gridCell.id}"] input`
			);
			if (!input) return;
			input.focus();
			if (initial === undefined) input.select();
		});
	}

	function writeCellValue(rowId: string, columnId: string, raw: string) {
		data = data.map((row) =>
			row.id === rowId ? { ...row, [columnId]: coerceValue(columnId, raw) } : row
		);
	}

	function commitEdit(move: 'down' | 'up' | 'left' | 'right' | 'stay') {
		const editedId = editingCellId;
		if (!editedId) return;

		const input = gridEl?.querySelector<HTMLInputElement>(`[data-cell-id="${editedId}"] input`);
		const raw = input ? input.value : editingValue;
		const edited = getCellById(table, editedId);
		if (edited) writeCellValue(edited.rowId, edited.columnId, raw);

		editingCellId = null;

		const refreshed = getCellById(table, editedId);
		if (!refreshed) return;

		activeCellId = refreshed.id;

		if (move === 'down') moveActive(1, 0, false);
		else if (move === 'up') moveActive(-1, 0, false);
		else if (move === 'left') moveActive(0, -1, false);
		else if (move === 'right') moveActive(0, 1, false);
		else {
			selectSingleCell(refreshed);
			focusCell(refreshed.id);
		}
	}

	function cancelEdit() {
		const editedId = editingCellId;
		editingCellId = null;
		if (editedId) focusCell(editedId);
	}

	function handleEditKeydown(event: KeyboardEvent) {
		event.stopPropagation();

		if (event.key === 'Enter') {
			event.preventDefault();
			commitEdit(event.shiftKey ? 'up' : 'down');
		} else if (event.key === 'Tab') {
			event.preventDefault();
			commitEdit(event.shiftKey ? 'left' : 'right');
		} else if (event.key === 'Escape') {
			event.preventDefault();
			cancelEdit();
		}
	}

	function handleEditBlur(cellId: string) {
		if (editingCellId === cellId) commitEdit('stay');
	}

	function clearSelectedCells() {
		const cells = getSelectedGridCells();
		if (cells.length === 0) return;

		const selectedIds = new Set(cells.map((cell) => cell.id));
		const columnIds = table.getAllLeafColumns().map((column) => column.id);

		data = data.map((row) => {
			const updated = { ...row } as Record<string, string | number>;
			let changed = false;

			for (const columnId of columnIds) {
				if (selectedIds.has(`${row.id}_${columnId}`)) {
					updated[columnId] = coerceValue(columnId, '');
					changed = true;
				}
			}

			return changed ? (updated as Deal) : row;
		});

		flashStatus(`Очищено ячеек: ${cells.length}`);
	}

	function isPrintableKey(event: KeyboardEvent) {
		return (
			event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && event.key !== ' '
		);
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		const modifier = event.metaKey || event.ctrlKey;
		if (!modifier) {
			if (event.key === 'Escape' && !editingCellId) clearSelection();
			return;
		}

		const key = event.key.toLowerCase();

		if (key === 'c') {
			if (selectedCells.size === 0) return;
			event.preventDefault();
			void copySelection();
		} else if (key === 'v') {
			event.preventDefault();
			void pasteSelection();
		} else if (key === 'a') {
			event.preventDefault();
			selectAllCells(table);
		}
	}

	function handleCellMouseDown(
		event: MouseEvent,
		tableInstance: Table<Features, Deal>,
		gridCell: GridCell
	) {
		if (event.button !== 0 || event.shiftKey) return;

		// preventDefault останавливает выделение текста при drag, но заодно отменяет
		// нативную фокусировку ячейки — возвращаем фокус вручную, иначе клавиатурная
		// навигация (стрелки) не получит keydown.
		event.preventDefault();
		(event.currentTarget as HTMLElement | null)?.focus();
		dragAnchorCellId = gridCell.id;
		anchorCellId = gridCell.id;
		activeCellId = gridCell.id;
		isDragging = true;
		dragSelectionChanged = false;
		selectRange(tableInstance, gridCell.id, gridCell.id);
	}

	function handleCellMouseEnter(tableInstance: Table<Features, Deal>, gridCell: GridCell) {
		hoveredCellId = gridCell.id;

		if (!isDragging || !dragAnchorCellId) return;

		dragSelectionChanged = dragAnchorCellId !== gridCell.id;
		activeCellId = gridCell.id;
		selectRange(tableInstance, dragAnchorCellId, gridCell.id);
	}

	function handleCellMouseLeave(gridCell: GridCell) {
		if (hoveredCellId === gridCell.id) {
			hoveredCellId = null;
		}
	}

	function handleCellClick(
		event: MouseEvent,
		tableInstance: Table<Features, Deal>,
		gridCell: GridCell
	) {
		if (suppressNextClick) {
			suppressNextClick = false;
			return;
		}

		if (event.shiftKey && anchorCellId) {
			selectRange(tableInstance, anchorCellId, gridCell.id);
			activeCellId = gridCell.id;
			return;
		}

		selectSingleCell(gridCell);
	}

	function handleCellKeydown(
		event: KeyboardEvent,
		tableInstance: Table<Features, Deal>,
		gridCell: GridCell
	) {
		// While editing, the input owns the keyboard.
		if (editingCellId) return;

		// Let copy/paste/select-all bubble to the window handler.
		if (event.ctrlKey || event.metaKey) return;

		const extend = event.shiftKey;

		switch (event.key) {
			case 'ArrowUp':
				event.preventDefault();
				moveActive(-1, 0, extend);
				return;
			case 'ArrowDown':
				event.preventDefault();
				moveActive(1, 0, extend);
				return;
			case 'ArrowLeft':
				event.preventDefault();
				moveActive(0, -1, extend);
				return;
			case 'ArrowRight':
				event.preventDefault();
				moveActive(0, 1, extend);
				return;
			case 'Tab':
				event.preventDefault();
				moveActive(0, extend ? -1 : 1, false);
				return;
			case 'Home':
				event.preventDefault();
				moveActiveTo(extend ? gridCell.rowIndex : 0, 0, extend);
				return;
			case 'End':
				event.preventDefault();
				moveActiveTo(
					extend ? gridCell.rowIndex : getRowCount() - 1,
					getColumnCount() - 1,
					extend
				);
				return;
			case 'Enter':
			case 'F2':
				event.preventDefault();
				startEditing(gridCell);
				return;
			case ' ':
				event.preventDefault();
				if (extend && anchorCellId) {
					selectRange(tableInstance, anchorCellId, gridCell.id);
					activeCellId = gridCell.id;
				} else {
					selectSingleCell(gridCell);
				}
				return;
			case 'Delete':
			case 'Backspace':
				event.preventDefault();
				clearSelectedCells();
				return;
		}

		if (isPrintableKey(event)) {
			event.preventDefault();
			startEditing(gridCell, event.key);
		}
	}

	function finishDrag() {
		if (!isDragging) return;

		suppressNextClick = dragSelectionChanged;
		isDragging = false;
		dragAnchorCellId = null;
		dragSelectionChanged = false;

		// Фокус во время drag остаётся на якорной ячейке; переносим его на активную
		// (конец диапазона), чтобы клавиатура продолжала работать от неё.
		if (activeCellId) focusCell(activeCellId);
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

<svelte:window onmouseup={finishDrag} onkeydown={handleWindowKeydown} />

<svelte:head>
	<title>TanStack grid selection demo</title>
</svelte:head>

<main class="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-950 sm:px-6 lg:px-8">
	<section class="mx-auto flex max-w-7xl flex-col gap-5">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p class="text-sm font-medium text-teal-700">Svelte 5 + @tanstack/svelte-table</p>
				<h1 class="mt-1 text-3xl font-semibold tracking-normal">TanStack grid selection demo</h1>
				<p class="mt-2 max-w-2xl text-sm text-zinc-500">
					<kbd class="rounded border border-zinc-300 bg-zinc-50 px-1 font-mono text-xs">↑↓←→</kbd>
					— навигация,
					<kbd class="rounded border border-zinc-300 bg-zinc-50 px-1 font-mono text-xs">Shift + ↑↓←→</kbd>
					— выделение диапазона,
					<kbd class="rounded border border-zinc-300 bg-zinc-50 px-1 font-mono text-xs">Enter</kbd>
					/ двойной клик — редактирование (текст / число / дата),
					<kbd class="rounded border border-zinc-300 bg-zinc-50 px-1 font-mono text-xs">Delete</kbd>
					— очистить,
					<kbd class="rounded border border-zinc-300 bg-zinc-50 px-1 font-mono text-xs">⌘/Ctrl + C / V</kbd>
					— копировать / вставить (Excel-like).
				</p>
			</div>

			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					class="rounded-md border border-teal-300 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800 shadow-sm hover:border-teal-400 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					disabled={selectedCells.size === 0}
					onclick={() => void copySelection()}
				>
					Копировать
				</button>
				<button
					type="button"
					class="rounded-md border border-teal-300 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800 shadow-sm hover:border-teal-400 focus:ring-2 focus:ring-teal-500 focus:outline-none"
					onclick={() => void pasteSelection()}
				>
					Вставить
				</button>
				<button
					type="button"
					class="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:border-zinc-400 focus:ring-2 focus:ring-teal-500 focus:outline-none"
					onclick={() => selectAllColumns(table)}
				>
					Выбрать все колонки
				</button>
				<button
					type="button"
					class="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:border-zinc-400 focus:ring-2 focus:ring-teal-500 focus:outline-none"
					onclick={() => selectAllCells(table)}
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

		{#if statusMessage}
			<div
				class="rounded-md border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800"
				role="status"
				aria-live="polite"
				data-testid="status-message"
			>
				{statusMessage}
			</div>
		{/if}

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
					bind:this={gridEl}
					role="grid"
					class="min-w-max select-none"
					aria-label="Deals selection grid"
					aria-rowcount={table.getRowModel().rows.length + 1}
					aria-colcount={table.getAllLeafColumns().length + 1}
				>
					<div role="row" class="grid bg-zinc-50" style={getGridTemplate(table)} aria-rowindex="1">
						<div
							role="columnheader"
							class="border-r border-b border-zinc-200 px-3 py-3 text-xs font-semibold text-zinc-400"
							aria-colindex="1"
							aria-label="Row selectors"
						>
							#
						</div>
						{#each table.getAllLeafColumns() as column, columnIndex (column.id)}
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
								onclick={() => selectColumn(table, column)}
								onkeydown={(event) => {
									if (event.key === 'Enter' || event.key === ' ') {
										event.preventDefault();
										selectColumn(table, column);
									}
								}}
							>
								{getHeaderText(column)}
							</div>
						{/each}
					</div>

					{#each table.getRowModel().rows as row, rowIndex (row.id)}
						{@const rowSelected = isRowSelected(row.id)}
						<div
							role="row"
							class="grid bg-white"
							style={getGridTemplate(table)}
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
								{@const cellActive = activeCellId === gridCell.id}
								{@const cellEditing = editingCellId === gridCell.id}
								{@const cellType = getColumnType(gridCell.columnId)}
								<div
									role="gridcell"
									tabindex="0"
									class={[
										'relative min-h-11 cursor-cell border-r border-b border-zinc-200 px-3 py-2 text-sm text-zinc-800 transition-colors outline-none',
										cellSelected &&
											'bg-sky-100 text-sky-950 ring-2 ring-sky-500 ring-inset hover:bg-sky-100',
										!cellSelected && cellHovered && 'bg-sky-50 ring-1 ring-sky-200 ring-inset',
										!cellSelected && !cellHovered && 'hover:bg-sky-50 focus:bg-sky-50',
										cellActive && 'z-10 shadow-[inset_0_0_0_2px_rgb(5,150,105)]'
									]}
									aria-colindex={gridCell.columnIndex + 2}
									aria-selected={cellSelected}
									aria-label={getCellLabel(gridCell)}
									data-cell-id={gridCell.id}
									data-cell-type={cellType}
									data-selected-cell={cellSelected ? 'true' : 'false'}
									data-hovered-cell={cellHovered ? 'true' : 'false'}
									data-active-cell={cellActive ? 'true' : 'false'}
									onmousedown={(event) => handleCellMouseDown(event, table, gridCell)}
									onmouseenter={() => handleCellMouseEnter(table, gridCell)}
									onmouseleave={() => handleCellMouseLeave(gridCell)}
									onclick={(event) => handleCellClick(event, table, gridCell)}
									ondblclick={() => startEditing(gridCell)}
									onkeydown={(event) => handleCellKeydown(event, table, gridCell)}
								>
									{#if cellEditing}
										<input
											type={cellType === 'number' ? 'number' : cellType === 'date' ? 'date' : 'text'}
											class="absolute inset-0 h-full w-full bg-white px-3 py-2 text-sm text-zinc-900 ring-2 ring-emerald-500 ring-inset outline-none"
											value={editingValue}
											onkeydown={handleEditKeydown}
											onblur={() => handleEditBlur(gridCell.id)}
											onmousedown={(event) => event.stopPropagation()}
											ondblclick={(event) => event.stopPropagation()}
										/>
									{:else}
										<FlexRender cell={gridCell.cell} />
									{/if}
								</div>
							{/each}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>
</main>
