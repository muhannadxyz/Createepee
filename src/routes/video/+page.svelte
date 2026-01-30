<script lang="ts">
	import { clips, selectedClipId, outputInfo, videoStatus } from '$lib/stores/videoEditor.store';
	import VideoPlayer from '$lib/components/video/VideoPlayer.svelte';
	import Timeline from '$lib/components/video/Timeline.svelte';
	import TrimPanel from '$lib/components/video/TrimPanel.svelte';
	import MergePanel from '$lib/components/video/MergePanel.svelte';
	import TextOverlayPanel from '$lib/components/video/TextOverlayPanel.svelte';
	import AudioPanel from '$lib/components/video/AudioPanel.svelte';
	import ExportPanel from '$lib/components/video/ExportPanel.svelte';
	import { postForm } from '$lib/utils/api';

	let uploadFile: File | null = null;
	const readFileInput = (event: Event) => (event.target as HTMLInputElement).files?.[0] ?? null;

	const handleUpload = async () => {
		if (!uploadFile) {
			videoStatus.set({ status: 'error', message: 'Select a video file.' });
			return;
		}
		videoStatus.set({ status: 'loading', message: 'Uploading video...' });
		const form = new FormData();
		form.set('file', uploadFile);
		const response = await postForm<{ videoId: string; url: string; originalName: string; size: number }>(
			'/api/video/upload',
			form
		);
		if (!response.success) {
			videoStatus.set({ status: 'error', message: response.error || 'Upload failed' });
			return;
		}
		const clip = response.data;
		if (clip) {
			clips.update((items) => [...items, { id: clip.videoId, url: clip.url, originalName: clip.originalName, size: clip.size }]);
			selectedClipId.set(clip.videoId);
			outputInfo.set({ outputId: null, outputUrl: null });
			videoStatus.set({ status: 'success', message: 'Upload complete' });
		}
		uploadFile = null;
	};
</script>

<div class="h-full p-6 text-white">
	<div class="flex items-center justify-between mb-4">
		<h2 class="text-2xl font-semibold">Video Editor</h2>
		<div class="text-xs bg-[#1c1c1c] border border-[#2a2a2a] px-3 py-1 rounded-full">
			{$videoStatus.status}
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr] gap-4 h-[calc(100%-3rem)]">
		<div class="space-y-4">
			<div class="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
				<h3 class="text-sm font-semibold">Upload</h3>
				<input type="file" accept="video/*" on:change={(e) => (uploadFile = readFileInput(e))} />
				<button class="px-3 py-2 text-xs rounded-lg bg-[#0f62fe]" on:click={handleUpload}>Upload Video</button>
				{#if $clips.length > 0}
					<div class="space-y-2 text-xs">
						{#each $clips as clip}
							<button
								class="block w-full text-left px-3 py-2 rounded border border-[#2a2a2a]"
								class:bg-[#0f62fe]={$selectedClipId === clip.id}
								on:click={() => selectedClipId.set(clip.id)}
							>
								{clip.originalName}
							</button>
						{/each}
					</div>
				{/if}
			</div>
			<VideoPlayer />
			<Timeline />
		</div>
		<div class="space-y-4 overflow-auto">
			<TrimPanel />
			<MergePanel />
			<TextOverlayPanel />
			<AudioPanel />
			<ExportPanel />
			<div class="text-xs text-[#9aa]">Status: {$videoStatus.status} {#if $videoStatus.message}- {$videoStatus.message}{/if}</div>
		</div>
	</div>
</div>
