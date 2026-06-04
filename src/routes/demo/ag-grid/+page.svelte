<script lang="ts">
	import { onMount } from 'svelte';
	import { faker } from '@faker-js/faker';
	import {
		createGrid,
		ModuleRegistry,
		AllEnterpriseModule,
		themeQuartz,
		type ColDef,
		type GridApi,
		type GridOptions,
		type ValueFormatterParams
	} from 'ag-grid-enterprise';
	import { AG_GRID_LOCALE_RU } from './ru-locale';

	// AllEnterpriseModule includes all community modules plus enterprise
	// features such as tree data.
	ModuleRegistry.registerModules([AllEnterpriseModule]);

	type Employee = {
		id: string;
		name: string;
		// Org hierarchy path from the root manager down to this person (names).
		orgHierarchy: string[];
		jobTitle: string;
		department: string;
		salary: number;
		startDate: Date;
	};

	// Seed faker so the demo (and its e2e test) renders deterministically.
	faker.seed(42);

	function generateData(): Employee[] {
		const rows: Employee[] = [];

		function build(parentPath: string[], depth: number) {
			const count = depth === 0 ? 4 : faker.number.int({ min: 0, max: 3 });

			for (let i = 0; i < count; i++) {
				const name = faker.person.fullName();
				const orgHierarchy = [...parentPath, name];

				rows.push({
					id: faker.string.uuid(),
					name,
					orgHierarchy,
					jobTitle: faker.person.jobTitle(),
					department: faker.commerce.department(),
					salary: faker.number.int({ min: 40000, max: 220000 }),
					startDate: faker.date.past({ years: 12 })
				});

				if (depth < 2) {
					build(orgHierarchy, depth + 1);
				}
			}
		}

		build([], 0);
		return rows;
	}

	const rowData = generateData();

	const salaryFormatter = new Intl.NumberFormat('ru-RU', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	});

	const dateFormatter = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' });

	const columnDefs: ColDef<Employee>[] = [
		{ field: 'jobTitle', headerName: 'Должность', minWidth: 200, cellDataType: 'text' },
		{ field: 'department', headerName: 'Отдел', minWidth: 160, cellDataType: 'text' },
		{
			field: 'salary',
			headerName: 'Зарплата',
			type: 'numericColumn',
			minWidth: 140,
			cellDataType: 'number',
			valueFormatter: (params: ValueFormatterParams<Employee, number>) =>
				params.value == null ? '' : salaryFormatter.format(params.value)
		},
		{
			field: 'startDate',
			headerName: 'Дата найма',
			minWidth: 150,
			cellDataType: 'date',
			valueFormatter: (params: ValueFormatterParams<Employee, Date>) =>
				params.value == null ? '' : dateFormatter.format(params.value)
		}
	];

	const gridOptions: GridOptions<Employee> = {
		theme: themeQuartz,
		localeText: AG_GRID_LOCALE_RU,
		rowData,
		columnDefs,
		treeData: true,
		getDataPath: (data) => data.orgHierarchy,
		getRowId: (params) => params.data.id,
		groupDefaultExpanded: 1,
		autoGroupColumnDef: {
			headerName: 'Сотрудник',
			minWidth: 320,
			// The hierarchy column shows the tree path, not an editable field.
			editable: false,
			// In-column text search by employee name, with a floating filter input
			// rendered under the header. Works against the name (not the full path),
			// and AG Grid keeps the ancestors of any match visible in the tree.
			filter: 'agTextColumnFilter',
			filterValueGetter: (params) => params.data?.name ?? '',
			cellRendererParams: {
				suppressCount: false
			}
		},
		defaultColDef: {
			flex: 1,
			minWidth: 140,
			sortable: true,
			resizable: true,
			editable: true,
			// Flash cells when their value changes via editing or paste.
			enableCellChangeFlash: true
		},
		// Excel-like range selection with a fill handle plus Ctrl+C / Ctrl+V
		// clipboard support (enterprise CellSelection + Clipboard modules).
		cellSelection: {
			handle: { mode: 'fill' }
		},
		// Commit edits when the cell loses focus, and allow undo/redo.
		stopEditingWhenCellsLoseFocus: true,
		undoRedoCellEditing: true,
		undoRedoCellEditingLimit: 20
	};

	let gridDiv: HTMLDivElement;
	let gridApi = $state<GridApi<Employee> | null>(null);
	let nameFilter = $state('');

	onMount(() => {
		gridApi = createGrid(gridDiv, gridOptions);

		return () => {
			gridApi?.destroy();
			gridApi = null;
		};
	});

	// Drive AG Grid's quick filter from the search input. Quick filter keeps the
	// ancestors of matching tree nodes visible, so filtering by name still shows
	// the full chain of managers above each match.
	$effect(() => {
		gridApi?.setGridOption('quickFilterText', nameFilter);
	});
</script>

<svelte:head>
	<title>AG Grid tree data demo</title>
</svelte:head>

<main class="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-950 sm:px-6 lg:px-8">
	<section class="mx-auto flex max-w-7xl flex-col gap-5">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p class="text-sm font-medium text-teal-700">Svelte 5 + AG Grid Enterprise</p>
				<h1 class="mt-1 text-3xl font-semibold tracking-normal">AG Grid tree data demo</h1>
				<p class="mt-1 text-sm text-zinc-500">
					Древовидная организационная структура, сгенерированная через faker.
				</p>
				<p class="mt-1 text-sm text-zinc-500">
					Двойной клик — редактирование ячейки. Выделяйте диапазон мышью, копируйте и вставляйте
					через Ctrl+C / Ctrl+V.
				</p>
			</div>

			<label class="flex flex-col gap-1 text-sm font-medium text-zinc-700">
				<span>Фильтр по имени</span>
				<input
					type="search"
					bind:value={nameFilter}
					placeholder="Например, Anna"
					class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none sm:w-72"
					data-testid="name-filter"
				/>
			</label>
		</div>

		<div
			bind:this={gridDiv}
			class="h-150 w-full overflow-hidden rounded-lg border border-zinc-200 shadow-sm"
			data-testid="ag-grid"
		></div>
	</section>
</main>
