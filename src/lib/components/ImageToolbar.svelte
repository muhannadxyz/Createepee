<script>
	import { activeTool, showExportModal, canvasInstance } from '$lib/stores/editorStore.js';
	
	const tools = [
		{ id: 'select', label: 'Select', icon: '↖' },
		{ id: 'text', label: 'Text', icon: 'T' },
		{ id: 'rectangle', label: 'Rectangle', icon: '▭' },
		{ id: 'circle', label: 'Circle', icon: '○' },
		{ id: 'ellipse', label: 'Ellipse', icon: '◯' },
		{ id: 'line', label: 'Line', icon: '─' },
		{ id: 'freedraw', label: 'Draw', icon: '✎' }
	];
	
	let strokeColor = '#000000';
	let fillColor = '#ffffff';
	let strokeWidth = 2;
	let textSize = 20;
	let textColor = '#000000';
	let showColorPicker = false;
	
	let showLayers = false;
	let showFilters = false;
	let brightness = 0;
	let contrast = 0;
	let saturation = 0;
	let blur = 0;
	
	function selectTool(toolId) {
		activeTool.set($activeTool === toolId ? null : toolId);
	}
	
	function toggleFilters() {
		showFilters = !showFilters;
	}
	
	function applyFilters() {
		// Dispatch custom event to ImageEditor
		const event = new CustomEvent('applyFilters', {
			detail: { brightness, contrast, saturation, blur }
		});
		window.dispatchEvent(event);
	}
	
	function resetFilters() {
		brightness = 0;
		contrast = 0;
		saturation = 0;
		blur = 0;
		applyFilters();
	}
	
	function openExport() {
		showExportModal.set(true);
	}
	
	function toggleLayers() {
		showLayers = !showLayers;
	}
	
	function deleteSelected() {
		if ($canvasInstance) {
			const activeObject = $canvasInstance.getActiveObject();
			if (activeObject) {
				$canvasInstance.remove(activeObject);
				$canvasInstance.renderAll();
			}
		}
	}
	
	function bringToFront() {
		if ($canvasInstance) {
			const activeObject = $canvasInstance.getActiveObject();
			if (activeObject) {
				$canvasInstance.bringToFront(activeObject);
				$canvasInstance.renderAll();
			}
		}
	}
	
	function sendToBack() {
		if ($canvasInstance) {
			const activeObject = $canvasInstance.getActiveObject();
			if (activeObject) {
				$canvasInstance.sendToBack(activeObject);
				$canvasInstance.renderAll();
			}
		}
	}

	function undo() {
		const event = new CustomEvent('undo');
		window.dispatchEvent(event);
	}

	function redo() {
		const event = new CustomEvent('redo');
		window.dispatchEvent(event);
	}

	function updateSelectedObject() {
		if (!$canvasInstance) return;
		const activeObject = $canvasInstance.getActiveObject();
		if (activeObject) {
			if (activeObject.type !== 'textbox' && activeObject.type !== 'text') {
				activeObject.set({
					stroke: strokeColor,
					fill: fillColor === '#ffffff' && activeObject.type !== 'rect' && activeObject.type !== 'circle' && activeObject.type !== 'ellipse' ? 'transparent' : fillColor,
					strokeWidth: strokeWidth
				});
			} else {
				activeObject.set({
					fill: textColor,
					fontSize: textSize
				});
			}
			$canvasInstance.renderAll();
		}
	}

	function toggleColorPicker() {
		showColorPicker = !showColorPicker;
	}
</script>

<div class="bg-[#2a2a2a] border-b border-[#3a3a3a] p-4 flex gap-8 items-center">
	<div class="flex items-center gap-4">
		<h3 class="m-0 text-sm text-[#aaa] font-medium">Tools</h3>
		<div class="flex gap-2">
			{#each tools as tool}
				<button 
					class="flex flex-col items-center gap-1 px-4 py-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded-md text-white cursor-pointer transition-all duration-200 text-sm hover:bg-[#4a4a4a] {$activeTool === tool.id ? 'bg-[#4a90e2] border-[#4a90e2]' : ''}"
					on:click={() => selectTool(tool.id)}
				>
					<span class="text-xl font-bold">{tool.icon}</span>
					<span class="text-xs">{tool.label}</span>
				</button>
			{/each}
		</div>
	</div>
	<div class="flex items-center gap-4 relative">
		<button class="px-6 py-3 bg-[#3a3a3a] border border-[#4a4a4a] rounded-md text-white font-medium cursor-pointer transition-all duration-200 hover:bg-[#4a4a4a] {showLayers ? 'bg-[#4a90e2] border-[#4a90e2]' : ''}" on:click={toggleLayers}>
			Layers
		</button>
		<button class="px-6 py-3 bg-[#3a3a3a] border border-[#4a4a4a] rounded-md text-white font-medium cursor-pointer transition-all duration-200 hover:bg-[#4a4a4a] {showFilters ? 'bg-[#4a90e2] border-[#4a90e2]' : ''}" on:click={toggleFilters}>
			Filters
		</button>
		{#if showFilters}
			<div class="absolute top-full left-[200px] mt-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-md min-w-[250px] z-[1000]">
				<div class="p-3 border-b border-[#3a3a3a] font-semibold">Filters</div>
				<div class="p-4 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="brightness" class="text-sm text-[#aaa]">Brightness: {brightness}</label>
						<input 
							id="brightness"
							type="range" 
							min="-100" 
							max="100" 
							bind:value={brightness}
							on:input={applyFilters}
							class="w-full"
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="contrast" class="text-sm text-[#aaa]">Contrast: {contrast}</label>
						<input 
							id="contrast"
							type="range" 
							min="-100" 
							max="100" 
							bind:value={contrast}
							on:input={applyFilters}
							class="w-full"
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="saturation" class="text-sm text-[#aaa]">Saturation: {saturation}</label>
						<input 
							id="saturation"
							type="range" 
							min="-100" 
							max="100" 
							bind:value={saturation}
							on:input={applyFilters}
							class="w-full"
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="blur" class="text-sm text-[#aaa]">Blur: {blur}</label>
						<input 
							id="blur"
							type="range" 
							min="0" 
							max="50" 
							bind:value={blur}
							on:input={applyFilters}
							class="w-full"
						/>
					</div>
				</div>
				<div class="p-3 border-t border-[#3a3a3a]">
					<button class="w-full py-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white cursor-pointer text-sm hover:bg-[#4a4a4a]" on:click={resetFilters}>Reset</button>
				</div>
			</div>
		{/if}
		{#if showLayers && $canvasInstance}
			<div class="absolute top-full left-0 mt-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-md min-w-[200px] max-h-[400px] z-[1000]">
				<div class="p-3 border-b border-[#3a3a3a] font-semibold">Layers</div>
				<div class="max-h-[200px] overflow-y-auto">
					{#each $canvasInstance.getObjects().slice().reverse() as obj, i}
						<div 
							role="button"
							tabindex="0"
							class="flex justify-between items-center px-3 py-2 cursor-pointer transition-colors duration-200 {$canvasInstance.getActiveObject() === obj ? 'bg-[#4a90e2]' : 'hover:bg-[#3a3a3a]'}"
							on:click={() => $canvasInstance.setActiveObject(obj)}
							on:keydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									$canvasInstance.setActiveObject(obj);
								}
							}}
						>
							<span>Layer {i + 1}</span>
							<button 
								class="bg-transparent border-none text-[#ff4444] cursor-pointer text-xl px-2 hover:text-[#ff6666]"
								on:click|stopPropagation={() => {
									$canvasInstance.remove(obj);
									$canvasInstance.renderAll();
								}}
							>×</button>
						</div>
					{/each}
				</div>
				<div class="p-3 border-t border-[#3a3a3a] flex flex-col gap-2">
					<button class="py-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white cursor-pointer text-sm hover:bg-[#4a4a4a]" on:click={bringToFront}>Bring to Front</button>
					<button class="py-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white cursor-pointer text-sm hover:bg-[#4a4a4a]" on:click={sendToBack}>Send to Back</button>
					<button class="py-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white cursor-pointer text-sm hover:bg-[#4a4a4a]" on:click={deleteSelected}>Delete Selected</button>
				</div>
			</div>
		{/if}
	</div>
	<div class="flex items-center gap-4">
		<button class="px-4 py-3 bg-[#3a3a3a] border border-[#4a4a4a] rounded-md text-white font-medium cursor-pointer transition-all duration-200 text-sm hover:bg-[#4a4a4a]" on:click={undo} title="Undo (Ctrl+Z)">
			↶ Undo
		</button>
		<button class="px-4 py-3 bg-[#3a3a3a] border border-[#4a4a4a] rounded-md text-white font-medium cursor-pointer transition-all duration-200 text-sm hover:bg-[#4a4a4a]" on:click={redo} title="Redo (Ctrl+Shift+Z)">
			↷ Redo
		</button>
	</div>
	
	<div class="flex items-center gap-4 relative">
		<button class="px-4 py-3 border-2 border-[#4a4a4a] rounded-md text-white font-medium cursor-pointer transition-all duration-200 text-sm min-w-[60px] hover:border-[#4a90e2]" style="background: {strokeColor};" on:click={toggleColorPicker}>
			Stroke
		</button>
		<button class="px-4 py-3 border-2 border-[#4a4a4a] rounded-md text-white font-medium cursor-pointer transition-all duration-200 text-sm min-w-[60px] hover:border-[#4a90e2]" style="background: {fillColor};" on:click={toggleColorPicker}>
			Fill
		</button>
		{#if showColorPicker}
			<div class="absolute top-full right-0 mt-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-md min-w-[250px] p-4 z-[1000]">
				<div class="flex flex-col gap-2 mb-4">
					<label for="stroke-color" class="text-sm text-[#aaa]">Stroke Color:</label>
					<input id="stroke-color" type="color" bind:value={strokeColor} on:input={updateSelectedObject} class="w-full h-10 border border-[#4a4a4a] rounded cursor-pointer" />
				</div>
				<div class="flex flex-col gap-2 mb-4">
					<label for="fill-color" class="text-sm text-[#aaa]">Fill Color:</label>
					<input id="fill-color" type="color" bind:value={fillColor} on:input={updateSelectedObject} class="w-full h-10 border border-[#4a4a4a] rounded cursor-pointer" />
				</div>
				<div class="flex flex-col gap-2 mb-4">
					<label for="text-color" class="text-sm text-[#aaa]">Text Color:</label>
					<input id="text-color" type="color" bind:value={textColor} on:input={updateSelectedObject} class="w-full h-10 border border-[#4a4a4a] rounded cursor-pointer" />
				</div>
				<div class="flex flex-col gap-2 mb-4">
					<label for="stroke-width" class="text-sm text-[#aaa]">Stroke Width: {strokeWidth}</label>
					<input id="stroke-width" type="range" min="1" max="20" bind:value={strokeWidth} on:input={updateSelectedObject} class="w-full" />
				</div>
				<div class="flex flex-col gap-2">
					<label for="text-size" class="text-sm text-[#aaa]">Text Size: {textSize}</label>
					<input id="text-size" type="range" min="10" max="100" bind:value={textSize} on:input={updateSelectedObject} class="w-full" />
				</div>
			</div>
		{/if}
	</div>
	
	<div class="flex items-center gap-4">
		<button class="px-6 py-3 bg-[#4a90e2] border-none rounded-md text-white font-semibold cursor-pointer transition-all duration-200 hover:bg-[#5aa0f2]" on:click={openExport}>
			Export
		</button>
	</div>
</div>


