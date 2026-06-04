<script lang="ts">
	import { tick } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { EditorType } from '@revolist/svelte-datagrid';

	let props: EditorType = $props();
	let input: HTMLInputElement | undefined = $state();

	function toDateInputValue(value: unknown) {
		if (!value) return '';
		if (value instanceof Date) return value.toISOString().slice(0, 10);

		return String(value).slice(0, 10);
	}

	const setupInput: Attachment<HTMLInputElement> = (element) => {
		input = element;

		return () => {
			if (input === element) input = undefined;
		};
	};

	export async function componentDidRender() {
		await tick();
		input?.focus();
		input?.showPicker?.();
	}

	export function beforeDisconnect() {
		input?.blur();
	}

	export function getValue() {
		return input?.value || undefined;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.isComposing) return;
		if (event.key !== 'Enter' && event.key !== 'Tab') return;

		beforeDisconnect();
		props.save(getValue(), event.key === 'Tab');
	}
</script>

<input
	class="typed-editor"
	type="date"
	value={toDateInputValue(props.val ?? props.value)}
	onkeydown={handleKeydown}
	{@attach setupInput}
/>

<style>
	.typed-editor {
		box-sizing: border-box;
		width: 100%;
		height: 100%;
		border: 0;
		background: #ffffff;
		color: #111827;
		font: inherit;
		padding: 0 8px;
	}

	.typed-editor:focus {
		outline: 2px solid #0d9488;
		outline-offset: -2px;
	}
</style>
