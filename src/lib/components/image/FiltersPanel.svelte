<script lang="ts">
	import { get } from 'svelte/store';
	import { adjustments, baseImage, imageCanvas } from '$lib/stores/imageEditor.store';
	import { applyFilters } from '$lib/utils/fabricTools';

	const readNumber = (event: Event) => Number((event.target as HTMLInputElement).value);

	const updateFilter = async (key: 'brightness' | 'contrast' | 'saturation' | 'blur', value: number) => {
		adjustments.update((state) => ({ ...state, [key]: value }));
		await apply();
	};

	const apply = async () => {
		const img = get(baseImage);
		const canvas = get(imageCanvas);
		if (!img || !canvas) return;
		const { fabric } = await import('fabric');
		applyFilters(fabric, img, get(adjustments));
		canvas.requestRenderAll();
	};

	const resetFilter = async (key: 'brightness' | 'contrast' | 'saturation' | 'blur') => {
		adjustments.update((state) => ({ ...state, [key]: 0 }));
		await apply();
	};

	const resetAll = async () => {
		adjustments.set({ brightness: 0, contrast: 0, saturation: 0, blur: 0 });
		await apply();
	};
</script>

<div class="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-4 text-white space-y-4">
	<h3 class="text-sm font-semibold">Adjustments</h3>
	{#if !$baseImage}
		<p class="text-xs text-[#9aa]">Upload an image to enable adjustments.</p>
	{:else}
		<div class="space-y-3 text-xs">
			<div class="space-y-1">
				<div class="flex items-center justify-between">
					<span>Brightness ({$adjustments.brightness.toFixed(2)})</span>
					<button class="text-[10px] px-2 py-1 bg-[#2c2c2c] rounded" on:click={() => resetFilter('brightness')}>Reset</button>
				</div>
				<input type="range" min="-1" max="1" step="0.01" value={$adjustments.brightness}
					on:input={(e) => updateFilter('brightness', readNumber(e))} />
			</div>
			<div class="space-y-1">
				<div class="flex items-center justify-between">
					<span>Contrast ({$adjustments.contrast.toFixed(2)})</span>
					<button class="text-[10px] px-2 py-1 bg-[#2c2c2c] rounded" on:click={() => resetFilter('contrast')}>Reset</button>
				</div>
				<input type="range" min="-1" max="1" step="0.01" value={$adjustments.contrast}
					on:input={(e) => updateFilter('contrast', readNumber(e))} />
			</div>
			<div class="space-y-1">
				<div class="flex items-center justify-between">
					<span>Saturation ({$adjustments.saturation.toFixed(2)})</span>
					<button class="text-[10px] px-2 py-1 bg-[#2c2c2c] rounded" on:click={() => resetFilter('saturation')}>Reset</button>
				</div>
				<input type="range" min="-1" max="1" step="0.01" value={$adjustments.saturation}
					on:input={(e) => updateFilter('saturation', readNumber(e))} />
			</div>
			<div class="space-y-1">
				<div class="flex items-center justify-between">
					<span>Blur ({$adjustments.blur.toFixed(2)})</span>
					<button class="text-[10px] px-2 py-1 bg-[#2c2c2c] rounded" on:click={() => resetFilter('blur')}>Reset</button>
				</div>
				<input type="range" min="0" max="1" step="0.01" value={$adjustments.blur}
					on:input={(e) => updateFilter('blur', readNumber(e))} />
			</div>
			<button class="w-full text-xs px-3 py-2 bg-[#2c2c2c] rounded" on:click={resetAll}>Reset all adjustments</button>
		</div>
	{/if}
</div>
