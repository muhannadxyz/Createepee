<script lang="ts">
	import CanvasStage from '$lib/components/image/CanvasStage.svelte';
	import ToolsPanel from '$lib/components/image/ToolsPanel.svelte';
	import LayersPanel from '$lib/components/image/LayersPanel.svelte';
	import FiltersPanel from '$lib/components/image/FiltersPanel.svelte';
	import ExportPanel from '$lib/components/image/ExportPanel.svelte';
	import PropertiesPanel from '$lib/components/image/PropertiesPanel.svelte';
	import OptionsBar from '$lib/components/image/OptionsBar.svelte';
	import { uiStatus } from '$lib/stores/ui.store';

	let activeTab: 'layers' | 'properties' | 'adjustments' | 'export' = 'layers';
</script>

<div class="h-full flex flex-col text-white">
	<OptionsBar />
	<div class="flex-1 flex overflow-hidden">
		<div class="w-16">
			<ToolsPanel />
		</div>
		<div class="flex-1 p-4 overflow-hidden">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-lg font-semibold">Image Editor</h2>
				<div class="text-xs bg-[#1c1c1c] border border-[#2a2a2a] px-3 py-1 rounded-full">
					{$uiStatus.image.status}
				</div>
			</div>
			<div class="h-[calc(100%-2.5rem)]">
				<CanvasStage />
			</div>
		</div>
		<div class="w-80 hidden lg:flex flex-col gap-4 p-4 overflow-y-auto border-l border-[#2a2a2a] bg-[#141414]">
			<LayersPanel />
			<PropertiesPanel />
			<FiltersPanel />
			<ExportPanel />
		</div>
	</div>

	<div class="lg:hidden border-t border-[#2a2a2a] bg-[#141414]">
		<div class="flex text-xs">
			<button class="flex-1 px-3 py-2" class:bg-[#1f1f1f]={activeTab === 'layers'} on:click={() => (activeTab = 'layers')}>Layers</button>
			<button class="flex-1 px-3 py-2" class:bg-[#1f1f1f]={activeTab === 'properties'} on:click={() => (activeTab = 'properties')}>Properties</button>
			<button class="flex-1 px-3 py-2" class:bg-[#1f1f1f]={activeTab === 'adjustments'} on:click={() => (activeTab = 'adjustments')}>Adjust</button>
			<button class="flex-1 px-3 py-2" class:bg-[#1f1f1f]={activeTab === 'export'} on:click={() => (activeTab = 'export')}>Export</button>
		</div>
		<div class="p-4">
			{#if activeTab === 'layers'}
				<LayersPanel />
			{:else if activeTab === 'properties'}
				<PropertiesPanel />
			{:else if activeTab === 'adjustments'}
				<FiltersPanel />
			{:else}
				<ExportPanel />
			{/if}
		</div>
	</div>
</div>
