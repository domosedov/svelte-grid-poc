<script>
	import { resolve } from '$app/paths';
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-100">
	<nav class="flex gap-4">
		<a
			href={resolve('/demo/grid')}
			class="rounded bg-blue-500 px-4 py-1 text-white transition-colors duration-150 hover:bg-blue-700"
			>TanStack Grid</a
		>
		<a
			href={resolve('/demo/tui-grid')}
			class="rounded bg-blue-500 px-4 py-1 text-white transition-colors duration-150 hover:bg-blue-700"
			>TUI Grid</a
		>
		<a
			href={resolve('/demo/ag-grid')}
			class="rounded bg-blue-500 px-4 py-1 text-white transition-colors duration-150 hover:bg-blue-700"
			>AG Grid</a
		>
		<a
			href={resolve('/demo/revo')}
			class="rounded bg-blue-500 px-4 py-1 text-white transition-colors duration-150 hover:bg-blue-700"
			>Revo</a
		>
	</nav>
</div>
