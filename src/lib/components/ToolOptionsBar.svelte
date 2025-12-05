<script>
	import { activeTool, canvasInstance } from '$lib/stores/editorStore.js';
	
	/**
	 * ToolOptionsBar Component
	 * 
	 * Top toolbar showing context-sensitive options for the currently active tool.
	 * Similar to Photoshop's options bar that changes based on selected tool.
	 */
	
	// Tool-specific options
	let constrainProportions = false;
	let alignToGrid = false;
	
	/**
	 * Get current tool options based on active tool
	 */
	$: toolOptions = (() => {
		switch ($activeTool) {
			case 'select':
				return {
					showAlign: true,
					showTransform: true,
					showConstrain: true
				};
			case 'rectangle':
			case 'circle':
			case 'ellipse':
				return {
					showConstrain: true,
					showFill: true,
					showStroke: true
				};
			case 'text':
				return {
					showFont: true,
					showSize: true,
					showAlign: true
				};
			case 'freedraw':
			case 'brush':
				return {
					showBrushSize: true,
					showOpacity: true,
					showFlow: true
				};
			case 'gradient':
				return {
					showGradientType: true,
					showAngle: true
				};
			default:
				return {};
		}
	})();
</script>

<div class="bg-[#2a2a2a] border-b border-[#3a3a3a] px-4 py-2 flex items-center gap-4">
	{#if $activeTool}
		<!-- Tool Name -->
		<span class="text-sm font-semibold text-white capitalize">
			{$activeTool === 'freedraw' ? 'Brush' : $activeTool} Tool
		</span>
		
		<div class="flex-1"></div>
		
		<!-- Constrain Proportions (for shapes and transform) -->
		{#if toolOptions.showConstrain}
			<label class="flex items-center gap-2 text-sm text-[#aaa] cursor-pointer">
				<input
					type="checkbox"
					bind:checked={constrainProportions}
					class="w-4 h-4"
				/>
				<span>Constrain Proportions</span>
			</label>
		{/if}
		
		<!-- Align to Grid (for selection tool) -->
		{#if toolOptions.showAlign}
			<label class="flex items-center gap-2 text-sm text-[#aaa] cursor-pointer">
				<input
					type="checkbox"
					bind:checked={alignToGrid}
					class="w-4 h-4"
				/>
				<span>Snap to Grid</span>
			</label>
		{/if}
	{:else}
		<span class="text-sm text-[#aaa]">No tool selected</span>
	{/if}
</div>

