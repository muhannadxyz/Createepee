<script lang="ts">
	import { get } from 'svelte/store';
	import { clips, selectedClipId, trimRange, outputInfo, videoStatus } from '$lib/stores/videoEditor.store';
	import { postJson } from '$lib/utils/api';

	const handleTrim = async () => {
		const clipId = get(selectedClipId);
		if (!clipId) {
			videoStatus.set({ status: 'error', message: 'Select a clip first.' });
			return;
		}
		const { startTime, endTime } = get(trimRange);
		videoStatus.set({ status: 'loading', message: 'Trimming video...' });
		const response = await postJson<{ outputId: string; outputUrl: string }>(
			'/api/video/trim',
			{ videoId: clipId, startTime, endTime }
		);
		if (!response.success) {
			videoStatus.set({ status: 'error', message: response.error || 'Trim failed' });
			return;
		}
		outputInfo.set({ outputId: response.data?.outputId ?? null, outputUrl: response.data?.outputUrl ?? null });
		videoStatus.set({ status: 'success', message: 'Trim complete' });
	};
</script>

<div class="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-4 text-white space-y-2">
	<h3 class="text-sm font-semibold">Trim</h3>
	<button class="px-3 py-2 text-xs rounded-lg bg-[#0f62fe] disabled:opacity-50" on:click={handleTrim} disabled={!$selectedClipId}>Trim Clip</button>
</div>
