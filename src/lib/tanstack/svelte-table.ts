import {
	createTable,
	functionalUpdate,
	type ColumnDefTemplate,
	type RowData,
	type TableOptions,
	type TableOptionsResolved,
	type TableState
} from '@tanstack/table-core';
import { derived, get, readable, writable, type Readable } from 'svelte/store';

export * from '@tanstack/table-core';

type ReadableOrValue<T> = T | Readable<T>;

function isReadable<T>(value: ReadableOrValue<T>): value is Readable<T> {
	return typeof value === 'object' && value !== null && 'subscribe' in value;
}

export function flexRender<TProps extends object>(
	component: ColumnDefTemplate<TProps> | undefined,
	props: TProps
) {
	if (!component) return null;

	return typeof component === 'function' ? component(props) : component;
}

export function createSvelteTable<TData extends RowData>(
	options: ReadableOrValue<TableOptions<TData>>
) {
	const optionsStore = isReadable(options) ? options : readable(options);
	const resolvedOptions: TableOptionsResolved<TData> = {
		state: {},
		onStateChange: () => {},
		renderFallbackValue: null,
		...get(optionsStore)
	};

	const table = createTable(resolvedOptions);
	const stateStore = writable<TableState>(table.initialState);
	const stateOptionsStore = derived([stateStore, optionsStore], (value) => value);

	return readable(table, (set) => {
		const unsubscribe = stateOptionsStore.subscribe(([state, currentOptions]) => {
			table.setOptions((previousOptions) => ({
				...previousOptions,
				...currentOptions,
				state: { ...state, ...currentOptions.state },
				onStateChange: (updater) => {
					stateStore.update((previousState) => functionalUpdate(updater, previousState));
					resolvedOptions.onStateChange?.(updater);
				}
			}));

			set(table);
		});

		return unsubscribe;
	});
}
