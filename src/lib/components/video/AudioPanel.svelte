<script lang="ts">
	import { get } from 'svelte/store';
	import { selectedClipId, outputInfo, videoStatus } from '$lib/stores/videoEditor.store';
	import { postForm } from '$lib/utils/api';

	let mode: 'replace' | 'mix' = 'replace';
	let volume = 1;
	let audioFile: File | null = null;
	let audioFileId = '';

	const readFileInput = (event: Event) => (event.target as HTMLInputElement).files?.[0] ?? null;

	const handleAudio = async () => {
		const clipId = get(selectedClipId);
		if (!clipId) {
			videoStatus.set({ status: 'error', message: 'Select a clip first.' });
			return;
		}
		if (!audioFile && !audioFileId) {
			videoStatus.set({ status: 'error', message: 'Provide an audio file or audio id.' });
			return;
		}
		videoStatus.set({ status: 'loading', message: 'Applying audio...' });
		const form = new FormData();
		form.set('videoId', clipId);
		form.set('mode', mode);
		form.set('volume', String(volume));
		if (audioFile) form.set('audio', audioFile);
		if (audioFileId) form.set('audioFileId', audioFileId);

		const response = await postForm<{ outputId: string; outputUrl: string }>(
			'/api/video/add-audio',
			form
		);
		if (!response.success) {
			videoStatus.set({ status: 'error', message: response.error || 'Audio failed' });
			return;
		}
		outputInfo.set({ outputId: response.data?.outputId ?? null, outputUrl: response.data?.outputUrl ?? null });
		videoStatus.set({ status: 'success', message: 'Audio applied' });
	};
</script>

<div class="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-4 text-white space-y-3">
	<h3 class="text-sm font-semibold">Audio</h3>
	<div class="grid grid-cols-2 gap-2 text-xs">
		<label class="flex flex-col gap-1">
			Mode
			<select bind:value={mode} class="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1">
				<option value="replace">Replace</option>
				<option value="mix">Mix</option>
			</select>
		</label>
		<label class="flex flex-col gap-1">
			Volume
			<input type="number" min="0" step="0.1" bind:value={volume} class="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1" />
		</label>
		<label class="col-span-2 flex flex-col gap-1">
			Upload audio
			<input type="file" accept="audio/*" on:change={(e) => (audioFile = readFileInput(e))} />
		</label>
		<label class="col-span-2 flex flex-col gap-1">
			Or audio file id
			<input type="text" bind:value={audioFileId} placeholder="existing-audio-id" class="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1" />
		</label>
	</div>
	<button class="px-3 py-2 text-xs rounded-lg bg-[#2c2c2c] disabled:opacity-50" on:click={handleAudio} disabled={!$selectedClipId}>Apply Audio</button>
</div>
