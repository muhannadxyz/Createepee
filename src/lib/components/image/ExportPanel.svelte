<script lang="ts">
	import { get } from 'svelte/store';
	import { imageCanvas } from '$lib/stores/imageEditor.store';
	import { exportCanvasImage } from '$lib/utils/exportImage';
	import { setUiStatus, uiStatus } from '$lib/stores/ui.store';

	let jpgQuality = 0.9;

	const doExport = (format: 'png' | 'jpeg') => {
		const canvas = get(imageCanvas);
		if (!canvas) {
			setUiStatus('image', 'error', 'Canvas not ready');
			return;
		}
		setUiStatus('image', 'loading', `Exporting ${format.toUpperCase()}...`);
		try {
			exportCanvasImage(canvas, format, jpgQuality);
			setUiStatus('image', 'success', `${format.toUpperCase()} exported`);
		} catch (error: any) {
			setUiStatus('image', 'error', error?.message || 'Export failed');
		}
	};
</script>

<div class="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-4 text-white space-y-3">
	<h3 class="text-sm font-semibold">Export</h3>
	<div class="flex flex-wrap items-center gap-2">
		<button class="px-3 py-2 text-xs rounded-lg bg-[#0f62fe]" on:click={() => doExport('png')}>Export PNG</button>
		<button class="px-3 py-2 text-xs rounded-lg bg-[#2c2c2c]" on:click={() => doExport('jpeg')}>Export JPG</button>
	</div>
	<label class="text-xs text-[#9aa] flex items-center gap-2">
		JPG Quality
		<input type="range" min="0.1" max="1" step="0.05" bind:value={jpgQuality} />
		<span>{jpgQuality.toFixed(2)}</span>
	</label>
	<div class="text-xs">
		Status: <span class="capitalize">{$uiStatus.image.status}</span>
		{#if $uiStatus.image.message}
			<span class="text-[#9aa]">— {$uiStatus.image.message}</span>
		{/if}
	</div>
</div>
