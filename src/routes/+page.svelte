<script>
	import { editorMode } from '$lib/stores/editorStore.js';
	import ImageEditor from '$lib/components/ImageEditor.svelte';
	import VideoEditor from '$lib/components/VideoEditor.svelte';
	import ExportModal from '$lib/components/ExportModal.svelte';
</script>

{#if $editorMode === 'image'}
	<ImageEditor />
{:else if $editorMode === 'video'}
	<VideoEditor />
{:else if $editorMode === 'document'}
	<div class="flex items-center justify-center h-full bg-[#1a1a1a] text-white">
		<div class="text-center">
			<h2 class="text-2xl font-semibold mb-4">Document Tools</h2>
			<p class="text-[#aaa]">Coming soon...</p>
		</div>
	</div>
{:else if $editorMode === 'converter'}
	<div class="flex items-center justify-center h-full bg-[#1a1a1a] text-white">
		<div class="text-center">
			<h2 class="text-2xl font-semibold mb-4">File Converters</h2>
			<p class="text-[#aaa]">Coming soon...</p>
		</div>
	</div>
{/if}

<ExportModal />
