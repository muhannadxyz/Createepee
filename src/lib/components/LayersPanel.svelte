<script>
	import { canvasInstance, activeTool } from '$lib/stores/editorStore.js';
	
	/**
	 * LayersPanel Component
	 * 
	 * Professional layers panel similar to Photoshop/Affinity with:
	 * - Layer visibility toggle (eye icon)
	 * - Layer lock toggle (lock icon)
	 * - Layer opacity slider
	 * - Layer rename functionality
	 * - Layer reordering (drag & drop)
	 * - Layer selection highlighting
	 */
	
	// Local state for layer management
	let draggedLayerIndex = null;
	let renamingLayerIndex = null;
	let renameValue = '';
	
	/**
	 * Get all canvas objects as layers (reversed for top-to-bottom display)
	 */
	$: layers = $canvasInstance ? $canvasInstance.getObjects().slice().reverse() : [];
	
	/**
	 * Get the currently active/selected object
	 */
	$: activeObject = $canvasInstance ? $canvasInstance.getActiveObject() : null;
	
	/**
	 * Toggle layer visibility
	 * @param {Object} obj - Fabric.js object representing the layer
	 */
	function toggleVisibility(obj) {
		if (!$canvasInstance || !obj) return;
		obj.visible = !obj.visible;
		$canvasInstance.renderAll();
	}
	
	/**
	 * Toggle layer lock state
	 * @param {Object} obj - Fabric.js object representing the layer
	 */
	function toggleLock(obj) {
		if (!$canvasInstance || !obj) return;
		obj.selectable = obj.selectable === false;
		obj.evented = obj.evented !== false;
		$canvasInstance.renderAll();
	}
	
	/**
	 * Update layer opacity
	 * @param {Object} obj - Fabric.js object representing the layer
	 * @param {number} opacity - Opacity value (0-1)
	 */
	function updateOpacity(obj, opacity) {
		if (!$canvasInstance || !obj) return;
		obj.opacity = opacity / 100;
		$canvasInstance.renderAll();
	}
	
	/**
	 * Start renaming a layer
	 * @param {Object} obj - Fabric.js object representing the layer
	 * @param {number} index - Layer index
	 */
	function startRename(obj, index) {
		renamingLayerIndex = index;
		renameValue = obj.name || `Layer ${index + 1}`;
	}
	
	/**
	 * Finish renaming a layer
	 * @param {Object} obj - Fabric.js object representing the layer
	 */
	function finishRename(obj) {
		if (renameValue.trim()) {
			obj.name = renameValue.trim();
		}
		renamingLayerIndex = null;
		renameValue = '';
	}
	
	/**
	 * Delete a layer
	 * @param {Object} obj - Fabric.js object representing the layer
	 */
	function deleteLayer(obj) {
		if (!$canvasInstance || !obj) return;
		$canvasInstance.remove(obj);
		$canvasInstance.renderAll();
	}
	
	/**
	 * Select a layer (make it active)
	 * @param {Object} obj - Fabric.js object representing the layer
	 */
	function selectLayer(obj) {
		if (!$canvasInstance || !obj) return;
		$canvasInstance.setActiveObject(obj);
		$canvasInstance.renderAll();
	}
	
	/**
	 * Handle drag start for layer reordering
	 * @param {number} index - Layer index being dragged
	 */
	function handleDragStart(index) {
		draggedLayerIndex = index;
	}
	
	/**
	 * Handle drag over event
	 * @param {Event} e - Drag event
	 */
	function handleDragOver(e) {
		e.preventDefault();
	}
	
	/**
	 * Handle drop event for layer reordering
	 * @param {number} targetIndex - Target layer index
	 */
	function handleDrop(targetIndex) {
		if (draggedLayerIndex === null || draggedLayerIndex === targetIndex || !$canvasInstance) return;
		
		const objects = $canvasInstance.getObjects();
		const sourceIndex = objects.length - 1 - draggedLayerIndex;
		const targetObjIndex = objects.length - 1 - targetIndex;
		
		// Reorder objects in canvas
		const sourceObj = objects[sourceIndex];
		objects.splice(sourceIndex, 1);
		objects.splice(targetObjIndex, 0, sourceObj);
		
		$canvasInstance.renderAll();
		draggedLayerIndex = null;
	}
	
	/**
	 * Get layer name or default name
	 * @param {Object} obj - Fabric.js object
	 * @param {number} index - Layer index
	 */
	function getLayerName(obj, index) {
		return obj.name || obj.type || `Layer ${index + 1}`;
	}
	
	/**
	 * Get layer opacity percentage
	 * @param {Object} obj - Fabric.js object
	 */
	function getLayerOpacity(obj) {
		return Math.round((obj.opacity !== undefined ? obj.opacity : 1) * 100);
	}
</script>

<div class="bg-[#2a2a2a] border-l border-[#3a3a3a] w-64 flex flex-col h-full">
	<!-- Panel Header -->
	<div class="p-3 border-b border-[#3a3a3a] flex items-center justify-between">
		<h3 class="text-sm font-semibold text-white m-0">Layers</h3>
	</div>
	
	<!-- Layers List -->
	<div class="flex-1 overflow-y-auto">
		{#if $canvasInstance && layers.length > 0}
			{#each layers as layer, index}
				<div
					class="flex items-center gap-2 px-2 py-1.5 border-b border-[#3a3a3a] cursor-pointer transition-colors duration-150 {activeObject === layer ? 'bg-[#4a90e2]' : 'hover:bg-[#3a3a3a]'}"
					on:click={() => selectLayer(layer)}
					draggable="true"
					on:dragstart={() => handleDragStart(index)}
					on:dragover={handleDragOver}
					on:drop={() => handleDrop(index)}
				>
					<!-- Visibility Toggle -->
					<button
						class="w-5 h-5 flex items-center justify-center text-xs text-[#aaa] hover:text-white transition-colors"
						on:click|stopPropagation={() => toggleVisibility(layer)}
						title={layer.visible !== false ? 'Hide layer' : 'Show layer'}
					>
						{layer.visible !== false ? '👁' : '👁‍🗨'}
					</button>
					
					<!-- Lock Toggle -->
					<button
						class="w-5 h-5 flex items-center justify-center text-xs text-[#aaa] hover:text-white transition-colors"
						on:click|stopPropagation={() => toggleLock(layer)}
						title={layer.selectable === false ? 'Unlock layer' : 'Lock layer'}
					>
						{layer.selectable === false ? '🔒' : '🔓'}
					</button>
					
					<!-- Layer Name -->
					<div class="flex-1 min-w-0">
						{#if renamingLayerIndex === index}
							<input
								type="text"
								bind:value={renameValue}
								class="w-full px-1 py-0.5 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-xs"
								on:blur={() => finishRename(layer)}
								on:keydown={(e) => {
									if (e.key === 'Enter') {
										finishRename(layer);
									} else if (e.key === 'Escape') {
										renamingLayerIndex = null;
									}
								}}
								autofocus
							/>
						{:else}
							<span
								class="text-xs text-white truncate block"
								on:dblclick={() => startRename(layer, index)}
								title="Double-click to rename"
							>
								{getLayerName(layer, index)}
							</span>
						{/if}
					</div>
					
					<!-- Opacity Slider -->
					<div class="flex items-center gap-1 w-16">
						<input
							type="range"
							min="0"
							max="100"
							value={getLayerOpacity(layer)}
							class="flex-1 h-1"
							on:input={(e) => updateOpacity(layer, e.target.value)}
							on:click|stopPropagation
							title="Opacity: {getLayerOpacity(layer)}%"
						/>
						<span class="text-xs text-[#aaa] w-8 text-right">{getLayerOpacity(layer)}%</span>
					</div>
					
					<!-- Delete Button -->
					<button
						class="w-5 h-5 flex items-center justify-center text-[#ff4444] hover:text-[#ff6666] transition-colors text-lg leading-none"
						on:click|stopPropagation={() => deleteLayer(layer)}
						title="Delete layer"
					>
						×
					</button>
				</div>
			{/each}
		{:else}
			<div class="p-4 text-center text-sm text-[#aaa]">
				No layers yet
			</div>
		{/if}
	</div>
	
	<!-- Layer Actions Footer -->
	{#if $canvasInstance && layers.length > 0}
		<div class="p-2 border-t border-[#3a3a3a] flex flex-col gap-1">
			<button
				class="px-3 py-1.5 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-xs cursor-pointer hover:bg-[#4a4a4a] transition-colors"
				on:click={() => {
					if (activeObject) {
						$canvasInstance.bringToFront(activeObject);
						$canvasInstance.renderAll();
					}
				}}
				disabled={!activeObject}
			>
				Bring to Front
			</button>
			<button
				class="px-3 py-1.5 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-xs cursor-pointer hover:bg-[#4a4a4a] transition-colors"
				on:click={() => {
					if (activeObject) {
						$canvasInstance.sendToBack(activeObject);
						$canvasInstance.renderAll();
					}
				}}
				disabled={!activeObject}
			>
				Send to Back
			</button>
		</div>
	{/if}
</div>

