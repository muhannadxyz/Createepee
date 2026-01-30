<script lang="ts">
	import { get } from 'svelte/store';
	import { selectedClipId, outputInfo, videoStatus } from '$lib/stores/videoEditor.store';
	import { postJson } from '$lib/utils/api';

	let text = 'Sample text';
	let x = 24;
	let y = 24;
	let fontSize = 32;
	let color = '#ffffff';
	let startTime = '';
	let endTime = '';

	const handleOverlay = async () => {
		const clipId = get(selectedClipId);
		if (!clipId || !text.trim()) {
			videoStatus.set({ status: 'error', message: 'Select a clip and enter text.' });
			return;
		}
		videoStatus.set({ status: 'loading', message: 'Adding text overlay...' });
		const payload: any = { videoId: clipId, text, x, y, fontSize, color };
		if (startTime !== '') payload.startTime = Number(startTime);
		if (endTime !== '') payload.endTime = Number(endTime);

		const response = await postJson<{ outputId: string; outputUrl: string }>(
			'/api/video/add-text',
			payload
		);
		if (!response.success) {
			videoStatus.set({ status: 'error', message: response.error || 'Overlay failed' });
			return;
		}
		outputInfo.set({ outputId: response.data?.outputId ?? null, outputUrl: response.data?.outputUrl ?? null });
		videoStatus.set({ status: 'success', message: 'Text overlay applied' });
	};
</script>

<div class="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-4 text-white space-y-3">
	<h3 class="text-sm font-semibold">Text Overlay</h3>
	<div class="grid grid-cols-2 gap-2 text-xs">
		<label class="col-span-2 flex flex-col gap-1">
			Text
			<input type="text" bind:value={text} class="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1" />
		</label>
		<label class="flex flex-col gap-1">
			X
			<input type="number" bind:value={x} class="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1" />
		</label>
		<label class="flex flex-col gap-1">
			Y
			<input type="number" bind:value={y} class="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1" />
		</label>
		<label class="flex flex-col gap-1">
			Font Size
			<input type="number" bind:value={fontSize} class="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1" />
		</label>
		<label class="flex flex-col gap-1">
			Color
			<input type="color" bind:value={color} />
		</label>
		<label class="flex flex-col gap-1">
			Start Time (s)
			<input type="number" step="0.1" bind:value={startTime} class="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1" />
		</label>
		<label class="flex flex-col gap-1">
			End Time (s)
			<input type="number" step="0.1" bind:value={endTime} class="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1" />
		</label>
	</div>
	<button class="px-3 py-2 text-xs rounded-lg bg-[#2c2c2c] disabled:opacity-50" on:click={handleOverlay} disabled={!$selectedClipId}>Apply Text</button>
</div>
