<script lang="ts">
	import { browser } from '$app/environment';
	import {
		Editor,
		RevoGrid,
		Template,
		type ColumnRegular,
		type Editors,
		type GroupingOptions
	} from '@revolist/svelte-datagrid';

	import DateEditor from './DateEditor.svelte';
	import NumberEditor from './NumberEditor.svelte';
	import StatusCell from './StatusCell.svelte';
	import { filterRowsByName, REVO_DEMO_ROWS, type RevoDemoRow } from './demo-data';

	const DATE_EDITOR = 'date';
	const NUMBER_EDITOR = 'number';

	const editors: Editors = {
		[DATE_EDITOR]: Editor(DateEditor),
		[NUMBER_EDITOR]: Editor(NumberEditor)
	};

	const moneyFormatter = new Intl.NumberFormat('ru-RU', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	});

	const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});

	const columns: ColumnRegular<string, RevoDemoRow>[] = [
		{
			prop: 'name',
			name: 'Сотрудник',
			size: 230,
			sortable: true
		},
		{
			prop: 'role',
			name: 'Роль',
			size: 210,
			sortable: true
		},
		{
			prop: 'status',
			name: 'Статус',
			size: 132,
			sortable: true,
			cellTemplate: Template(StatusCell)
		},
		{
			prop: 'budget',
			name: 'Бюджет',
			size: 140,
			sortable: true,
			editor: NUMBER_EDITOR,
			cellTemplate: (h, { value }) =>
				h(
					'span',
					{
						style: {
							display: 'block',
							fontWeight: '650',
							textAlign: 'right'
						}
					},
					moneyFormatter.format(Number(value ?? 0))
				)
		},
		{
			prop: 'progress',
			name: 'Прогресс',
			size: 132,
			sortable: true,
			editor: NUMBER_EDITOR,
			cellTemplate: (h, { value }) =>
				h(
					'span',
					{
						style: {
							display: 'block',
							fontVariantNumeric: 'tabular-nums',
							fontWeight: '650',
							textAlign: 'right'
						}
					},
					`${Number(value ?? 0)}%`
				)
		},
		{
			prop: 'startDate',
			name: 'Старт',
			size: 150,
			sortable: true,
			editor: DATE_EDITOR,
			cellTemplate: (h, { value }) => h('span', {}, dateFormatter.format(new Date(String(value))))
		}
	];

	let nameFilter = $state('');

	let filteredRows = $derived(filterRowsByName(REVO_DEMO_ROWS, nameFilter));
	let grouping: GroupingOptions = $state({
		props: ['division', 'team'],
		expandedAll: true,
		preserveGroupingOnUpdate: true
	});

	function clearFilter() {
		nameFilter = '';
	}

	function expandAll() {
		grouping = {
			...grouping,
			expandedAll: true,
			prevExpanded: {}
		};
	}

	function collapseAll() {
		grouping = {
			...grouping,
			expandedAll: false,
			prevExpanded: {}
		};
	}
</script>

<svelte:head>
	<title>RevoGrid tree rows demo</title>
</svelte:head>

<main class="page-shell">
	<section class="workspace" aria-labelledby="revo-grid-title">
		<div class="header-row">
			<div class="title-block">
				<p class="eyebrow">Svelte 5 + RevoGrid</p>
				<h1 id="revo-grid-title">RevoGrid tree rows demo</h1>
				<p>
					Группировка строк по направлению и команде, внешний фильтр по имени, Svelte renderer для
					статуса и spreadsheet-режим с выделением диапазонов.
				</p>
			</div>

			<div class="metrics" aria-label="Статистика таблицы">
				<div>
					<span data-testid="visible-row-count"
						>{filteredRows.length} из {REVO_DEMO_ROWS.length}</span
					>
					<small>строк</small>
				</div>
				<div>
					<span data-testid="active-filter">{nameFilter || 'Все'}</span>
					<small>фильтр</small>
				</div>
			</div>
		</div>

		<div class="toolbar" aria-label="Управление таблицей">
			<label class="filter-control">
				<span>Фильтр по имени</span>
				<input
					type="search"
					bind:value={nameFilter}
					placeholder="Например, Никита"
					autocomplete="off"
					data-testid="name-filter"
				/>
			</label>

			<div class="button-group">
				<button type="button" onclick={clearFilter} disabled={!nameFilter}>Сбросить</button>
				<button type="button" onclick={expandAll}>Раскрыть все</button>
				<button type="button" onclick={collapseAll}>Свернуть все</button>
			</div>
		</div>

		<div class="grid-frame" data-testid="revo-grid-frame">
			{#if browser}
				<RevoGrid
					source={filteredRows}
					{columns}
					{editors}
					{grouping}
					rowHeaders={true}
					range={true}
					useClipboard={true}
					resize={true}
					canFocus={true}
					filter={true}
					readonly={false}
					stretch={true}
					theme="material"
				/>
			{/if}

			{#if filteredRows.length === 0}
				<div class="empty-state">Нет сотрудников по такому фильтру</div>
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
		color: #047857;
		font-size: 0.78rem;
		font-weight: 750;
		letter-spacing: 0;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		font-size: 2.35rem;
		font-weight: 760;
		letter-spacing: 0;
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
		border-color: #0d9488;
		box-shadow: 0 0 0 3px rgb(13 148 136 / 16%);
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
		border-color: #0d9488;
		color: #0f766e;
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
	}

	.grid-frame :global(revo-grid) {
		height: 100%;
		min-height: 520px;
		font-family:
			Inter,
			ui-sans-serif,
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
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
