<script>
	import { canvasInstance } from '$lib/stores/editorStore.js';
	
	/**
	 * StatusBar Component
	 * 
	 * Bottom status bar displaying:
	 * - Zoom level
	 * - Canvas dimensions
	 * - Cursor position
	 * - Selection info
	 */
	
	let zoomLevel = 100;
	let cursorX = 0;
	let cursorY = 0;
	let canvasWidth = 800;
	let canvasHeight = 600;
	
	/**
	 * Update status bar information when canvas changes
	 */
	$: if ($canvasInstance) {
		canvasWidth = $canvasInstance.width;
		canvasHeight = $canvasInstance.height;
		
		// Listen to mouse move events for cursor position
		$canvasInstance.on('mouse:move', (e) => {
			const pointer = $canvasInstance.getPointer(e.e);
			cursorX = Math.round(pointer.x);
			cursorY = Math.round(pointer.y);
		});
	}
	
	/**
	 * Handle zoom in
	 */
	function zoomIn() {
		if (!$canvasInstance) return;
		zoomLevel = Math.min(zoomLevel + 10, 500);
		updateZoom();
	}
	
	/**
	 * Handle zoom out
	 */
	function zoomOut() {
		if (!$canvasInstance) return;
		zoomLevel = Math.max(zoomLevel - 10, 25);
		updateZoom();
	}
	
	/**
	 * Reset zoom to 100%
	 */
	function resetZoom() {
		if (!$canvasInstance) return;
		zoomLevel = 100;
		updateZoom();
	}
	
	/**
	 * Update canvas zoom level
	 */
	function updateZoom() {
		if (!$canvasInstance) return;
		const zoom = zoomLevel / 100;
		// Note: Fabric.js doesn't have built-in zoom, so we'd need to implement viewport transform
		// For now, we'll just display the zoom level
	}
	
	/**
	 * Get selection info
	 */
	$: selectionInfo = $canvasInstance ? (() => {
		const activeObject = $canvasInstance.getActiveObject();
		if (activeObject) {
			return `${activeObject.type || 'Object'}`;
		}
		return 'No selection';
	})() : 'No canvas';
</script>

<div class="bg-[#2a2a2a] border-t border-[#3a3a3a] px-4 py-2 flex items-center justify-between text-xs text-[#aaa]">
	<!-- Left Section: Zoom Controls -->
	<div class="flex items-center gap-2">
		<button
			class="px-2 py-1 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white hover:bg-[#4a4a4a] transition-colors"
			on:click={zoomOut}
			title="Zoom Out"
		>
			−
		</button>
		<span class="px-2 py-1 min-w-[60px] text-center">{zoomLevel}%</span>
		<button
			class="px-2 py-1 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white hover:bg-[#4a4a4a] transition-colors"
			on:click={zoomIn}
			title="Zoom In"
		>
			+
		</button>
		<button
			class="px-2 py-1 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white hover:bg-[#4a4a4a] transition-colors ml-2"
			on:click={resetZoom}
			title="Reset Zoom"
		>
			Reset
		</button>
	</div>
	
	<!-- Center Section: Canvas Dimensions -->
	<div class="flex items-center gap-4">
		<span>Canvas: {canvasWidth} × {canvasHeight}px</span>
	</div>
	
	<!-- Right Section: Cursor Position & Selection -->
	<div class="flex items-center gap-4">
		<span>Cursor: ({cursorX}, {cursorY})</span>
		<span class="border-l border-[#3a3a3a] pl-4">{selectionInfo}</span>
	</div>
</div>

