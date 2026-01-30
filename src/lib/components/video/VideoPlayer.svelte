<script lang="ts">
	import { clips, selectedClipId, outputInfo } from '$lib/stores/videoEditor.store';

	$: activeUrl = $outputInfo.outputUrl || ($selectedClipId ? $clips.find((c) => c.id === $selectedClipId)?.url : null);
</script>

<div class="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-4 text-white space-y-3">
	<h3 class="text-sm font-semibold">Preview</h3>
	{#if activeUrl}
		<video class="w-full rounded-lg" controls src={activeUrl}></video>
	{:else}
		<p class="text-xs text-[#9aa]">Upload a video to start.</p>
	{/if}
</div>
