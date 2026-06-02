import adapter from '@sveltejs/adapter-auto';
import { fileURLToPath } from 'node:url';

const tanstackSvelteTableCompat = fileURLToPath(
	new URL('./src/lib/tanstack/svelte-table.ts', import.meta.url)
);

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		alias: {
			'@tanstack/svelte-table': tanstackSvelteTableCompat
		},
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter()
	}
};

export default config;
