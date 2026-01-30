<script lang="ts">
	import { get } from 'svelte/store';
	import { imageCanvas, layers, selectedObjectIds } from '$lib/stores/imageEditor.store';
	import { buildLayers, renameLayer, reorderLayer, toggleLayerLock, toggleLayerVisibility } from '$lib/utils/fabricTools';

	let draggingIndex: number | null = null;
	let editingId: string | null = null;
	let editName = '';
	let lastSelectedIndex: number | null = null;

	const readValue = (event: Event) => (event.target as HTMLInputElement).value;

	const refreshLayers = () => {
		const canvas = get(imageCanvas);
		if (!canvas) return;
		layers.set(buildLayers(canvas));
	};

	const applySelection = (ids: string[]) => {
		const canvas = get(imageCanvas);
		if (!canvas) return;
		const layerList = get(layers);
		const objects = ids
			.map((id) => layerList.find((layer) => layer.id === id)?.object)
			.filter(Boolean);
		if (!objects.length) return;
		if (objects.length === 1) {
			canvas.setActiveObject(objects[0]);
		} else {
			const selection = new canvas.fabric.ActiveSelection(objects, { canvas });
			canvas.setActiveObject(selection);
		}
		canvas.requestRenderAll();
		selectedObjectIds.set(ids);
	};

	const selectLayer = (layer: any, index: number, event: MouseEvent) => {
		const isMulti = event.metaKey || event.ctrlKey;
		const isRange = event.shiftKey;
		if (isRange && lastSelectedIndex !== null) {
			const start = Math.min(lastSelectedIndex, index);
			const end = Math.max(lastSelectedIndex, index);
			const rangeIds = get(layers).slice(start, end + 1).map((item) => item.id);
			applySelection(rangeIds);
			return;
		}

		if (isMulti) {
			const current = new Set(get(selectedObjectIds));
			if (current.has(layer.id)) {
				current.delete(layer.id);
			} else {
				current.add(layer.id);
			}
			applySelection(Array.from(current));
		} else {
			applySelection([layer.id]);
		}
		lastSelectedIndex = index;
	};

	const startRename = (layer: any) => {
		editingId = layer.id;
		editName = layer.name;
	};

	const commitRename = () => {
		const canvas = get(imageCanvas);
		if (!canvas || !editingId) return;
		renameLayer(canvas, editingId, editName.trim() || 'Layer');
		editingId = null;
		refreshLayers();
	};

	const cancelRename = () => {
		editingId = null;
	};

	const handleDragStart = (index: number) => {
		draggingIndex = index;
	};

	const handleDrop = (index: number) => {
		if (draggingIndex === null) return;
		const canvas = get(imageCanvas);
		if (!canvas) return;
		reorderLayer(canvas, draggingIndex, index);
		draggingIndex = null;
		refreshLayers();
	};

	const toggleVisibility = (layerId: string) => {
		const canvas = get(imageCanvas);
		if (!canvas) return;
		toggleLayerVisibility(canvas, layerId);
		refreshLayers();
	};

	const toggleLock = (layerId: string) => {
		const canvas = get(imageCanvas);
		if (!canvas) return;
		toggleLayerLock(canvas, layerId);
		refreshLayers();
	};

	const removeLayer = (layer: any) => {
		const canvas = get(imageCanvas);
		if (!canvas) return;
		canvas.remove(layer.object);
		canvas.requestRenderAll();
		refreshLayers();
	};
</script>

<div class="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-4 text-white">
	<h3 class="text-sm font-semibold mb-3">Layers</h3>
	<div class="space-y-2 max-h-64 overflow-auto">
		{#if $layers.length === 0}
			<p class="text-xs text-[#9aa]">No layers yet.</p>
		{:else}
			{#each $layers as layer, index}
				<div
					class="flex items-center gap-2 p-2 rounded-lg border border-[#2a2a2a]"
					draggable="true"
					on:dragstart={() => handleDragStart(index)}
					on:dragover|preventDefault
					on:drop={() => handleDrop(index)}
				>
					<button class="text-[10px] px-2 py-1 bg-[#2c2c2c] rounded" on:click={() => toggleVisibility(layer.id)} title="Toggle visibility">{layer.visible ? 'SHOW' : 'HIDE'}</button>
					<button class="text-[10px] px-2 py-1 bg-[#2c2c2c] rounded" on:click={() => toggleLock(layer.id)} title="Toggle lock">{layer.locked ? 'LOCK' : 'UNLOCK'}</button>
					{#if editingId === layer.id}
						<input
							value={editName}
							class="flex-1 bg-[#111] border border-[#2a2a2a] rounded px-2 py-1 text-xs"
							on:input={(e) => (editName = readValue(e))}
							on:keydown={(e) => {
								if (e.key === 'Enter') commitRename();
								if (e.key === 'Escape') cancelRename();
							}}
							on:blur={commitRename}
						/>
					{:else}
						<button
							class="flex-1 text-left text-xs"
							class:font-semibold={$selectedObjectIds.includes(layer.id)}
							on:click={(event) => selectLayer(layer, index, event)}
							on:dblclick={() => startRename(layer)}
						>
							{layer.name}
						</button>
					{/if}
					<button class="text-[10px] px-2 py-1 bg-[#3a1f1f] rounded" on:click={() => removeLayer(layer)}>Delete</button>
				</div>
			{/each}
		{/if}
	</div>
</div>
