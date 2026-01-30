<script lang="ts">
	import { clips, outputInfo, videoStatus } from '$lib/stores/videoEditor.store';
	import { postJson } from '$lib/utils/api';

	let selectedIds: string[] = [];

	const toggleClip = (id: string) => {
		selectedIds = selectedIds.includes(id)
			? selectedIds.filter((item) => item !== id)
			: [...selectedIds, id];
	};

	const handleMerge = async () => {
		if (selectedIds.length < 2) {
			videoStatus.set({ status: 'error', message: 'Select at least 2 clips.' });
			return;
		}
		videoStatus.set({ status: 'loading', message: 'Merging clips...' });
		const response = await postJson<{ outputId: string; outputUrl: string }>(
			'/api/video/merge',
			{ videoIds: selectedIds, order: selectedIds }
		);
		if (!response.success) {
			videoStatus.set({ status: 'error', message: response.error || 'Merge failed' });
			return;
		}
		outputInfo.set({ outputId: response.data?.outputId ?? null, outputUrl: response.data?.outputUrl ?? null });
		videoStatus.set({ status: 'success', message: 'Merge complete' });
	};
</script>

<div class="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-4 text-white space-y-3">
	<h3 class="text-sm font-semibold">Merge</h3>
	<div class="space-y-2 max-h-32 overflow-auto text-xs">
		{#if $clips.length === 0}
			<p class="text-[#9aa]">No clips uploaded.</p>
		{:else}
			{#each $clips as clip}
				<label class="flex items-center gap-2">
					<input type="checkbox" checked={selectedIds.includes(clip.id)} on:change={() => toggleClip(clip.id)} />
					<span>{clip.originalName}</span>
				</label>
			{/each}
		{/if}
	</div>
	<button class="px-3 py-2 text-xs rounded-lg bg-[#2c2c2c] disabled:opacity-50" on:click={handleMerge} disabled={selectedIds.length < 2}>Merge Selected</button>
</div>
