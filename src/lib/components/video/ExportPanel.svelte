<script lang="ts">
	import { get } from 'svelte/store';
	import { outputInfo, videoStatus } from '$lib/stores/videoEditor.store';

	const handleExport = async () => {
		const outputId = get(outputInfo).outputId;
		if (!outputId) {
			videoStatus.set({ status: 'error', message: 'No output to export.' });
			return;
		}
		videoStatus.set({ status: 'loading', message: 'Preparing download...' });
		const response = await fetch(`/api/video/export?outputId=${outputId}`);
		const payload = await response.json();
		if (!payload.success) {
			videoStatus.set({ status: 'error', message: payload.error || 'Export failed' });
			return;
		}
		const url = payload.data?.downloadUrl;
		if (url) {
			const link = document.createElement('a');
			link.href = url;
			link.download = `export-${outputId}.mp4`;
			link.click();
			videoStatus.set({ status: 'success', message: 'Download started' });
		} else {
			videoStatus.set({ status: 'error', message: 'Missing download URL' });
		}
	};
</script>

<div class="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-4 text-white space-y-2">
	<h3 class="text-sm font-semibold">Export</h3>
	<button class="px-3 py-2 text-xs rounded-lg bg-[#0f62fe] disabled:opacity-50" on:click={handleExport} disabled={!$outputInfo.outputId}>Download MP4</button>
</div>
