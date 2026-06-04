declare module '@revolist/svelte-datagrid' {
	import type { Component } from 'svelte';

	export type ColumnProp = string | number;
	export type DataType = object;
	type ModelFromProps<TProps> = TProps extends { model: infer TModel extends DataType }
		? TModel
		: DataType;
	export type HyperFunc<T = unknown> = (
		tag: string,
		props?: Record<string, unknown>,
		children?: unknown
	) => T;
	export type EditorCtr = unknown;
	export type Editors = Record<string, EditorCtr>;

	export interface ColumnDataSchemaModel<
		TModel extends DataType = DataType,
		TColumn extends ColumnRegular = ColumnRegular,
		TProp extends ColumnProp = TColumn['prop']
	> {
		prop: TProp;
		model: TModel;
		column: TColumn;
		rowIndex: number;
		colIndex: number;
		colType: string;
		type: string;
		data: TModel[];
		value?: TProp extends keyof TModel ? TModel[TProp] : unknown;
	}

	export interface CellTemplateProp<
		TModel extends DataType = DataType,
		TColumn extends ColumnRegular = ColumnRegular,
		TProp extends ColumnProp = TColumn['prop']
	> extends ColumnDataSchemaModel<TModel, TColumn, TProp> {
		providers: unknown;
	}

	export type CellTemplate<TModel extends DataType = DataType> = (
		createElement: HyperFunc,
		props: CellTemplateProp<TModel>,
		additionalData?: unknown
	) => unknown;

	export interface ColumnRegular<
		P extends ColumnProp = ColumnProp,
		TModel extends DataType = DataType
	> {
		prop: P;
		name?: unknown;
		size?: number;
		minSize?: number;
		maxSize?: number;
		sortable?: boolean;
		filter?: boolean | string | string[];
		editor?: string | EditorCtr;
		readonly?:
			| boolean
			| ((params: ColumnDataSchemaModel<TModel, ColumnRegular<P, TModel>>) => boolean);
		cellTemplate?: CellTemplate<TModel>;
		cellParser?: (model: TModel, column: ColumnRegular<P, TModel>) => unknown;
		[key: string]: unknown;
	}

	export type GroupingOptions = {
		props?: ColumnProp[];
		preserveGroupingOnUpdate?: boolean;
		expandedAll?: boolean;
		prevExpanded?: Record<string, boolean>;
		getGroupValue?: (item: DataType, prop: ColumnProp) => unknown;
	};

	export type SvelteCellProps<TModel extends DataType = DataType> = CellTemplateProp<TModel> & {
		addition?: unknown;
		[key: string]: unknown;
	};

	export type EditorType = Omit<Partial<ColumnDataSchemaModel>, 'column'> & {
		val?: unknown;
		column: ColumnDataSchemaModel;
		save: (value: unknown, preventFocus?: boolean) => void;
		close: (focusNext?: boolean) => void;
		[key: string]: unknown;
	};

	export type RevoGridProps = {
		source?: unknown[];
		columns?: unknown;
		editors?: Editors;
		grouping?: unknown;
		rowHeaders?: boolean | object;
		range?: boolean;
		useClipboard?: boolean;
		resize?: boolean;
		canFocus?: boolean;
		filter?: boolean | object;
		readonly?: boolean;
		stretch?: boolean;
		theme?: string;
	};

	export const RevoGrid: Component<RevoGridProps>;

	export function Template<TProps extends Record<string, unknown>>(
		component: Component<TProps>,
		customProps?: Partial<TProps>
	): CellTemplate<ModelFromProps<TProps>>;

	export function Editor(component: Component<EditorType>): EditorCtr;
}
