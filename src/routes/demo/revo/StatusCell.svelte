<script lang="ts">
	import { getStatusLabel, type RevoDemoRow, type RowStatus } from './demo-data';

	type Props = {
		model: RevoDemoRow;
		value?: RowStatus;
	};

	let { model, value = model.status }: Props = $props();

	const statusClass: Record<RowStatus, string> = {
		active: 'active',
		risk: 'risk',
		paused: 'paused'
	};
</script>

<span
	class={['status-cell', statusClass[value]]}
	data-testid={`status-cell-${value}`}
	title={`${model.name}: ${getStatusLabel(value)}`}
>
	<span class="dot"></span>
	{getStatusLabel(value)}
</span>

<style>
	.status-cell {
		display: inline-flex;
		min-width: 84px;
		align-items: center;
		gap: 6px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 650;
		line-height: 1;
		padding: 6px 8px;
	}

	.dot {
		width: 7px;
		height: 7px;
		border-radius: 999px;
		background: currentColor;
	}

	.active {
		background: #dcfce7;
		color: #166534;
	}

	.risk {
		background: #fef3c7;
		color: #92400e;
	}

	.paused {
		background: #e5e7eb;
		color: #374151;
	}
</style>
