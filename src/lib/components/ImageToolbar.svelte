<script>
	import { activeTool, showExportModal, canvasInstance, leftPanelCollapsed } from '$lib/stores/editorStore.js';
	
	/**
	 * ImageToolbar Component (Left Sidebar)
	 * 
	 * Professional tool palette organized into groups, similar to Photoshop/Affinity.
	 * Tools are grouped by functionality:
	 * - Selection tools
	 * - Drawing tools
	 * - Shape tools
	 * - Text tool
	 * - Brush tools
	 * - Special tools (gradient, etc.)
	 */
	
	// Tool groups for organized display
	const toolGroups = [
		{
			name: 'Selection',
			tools: [
				{ id: 'select', label: 'Select', icon: '↖', shortcut: 'V' },
				{ id: 'lasso', label: 'Lasso', icon: '✂', shortcut: 'L' },
				{ id: 'magicwand', label: 'Magic Wand', icon: '✨', shortcut: 'W' }
			]
		},
		{
			name: 'Drawing',
			tools: [
				{ id: 'freedraw', label: 'Brush', icon: '✎', shortcut: 'B' },
				{ id: 'line', label: 'Line', icon: '─', shortcut: 'L' }
			]
		},
		{
			name: 'Shapes',
			tools: [
				{ id: 'rectangle', label: 'Rectangle', icon: '▭', shortcut: 'R' },
				{ id: 'circle', label: 'Circle', icon: '○', shortcut: 'C' },
				{ id: 'ellipse', label: 'Ellipse', icon: '◯', shortcut: 'E' }
			]
		},
		{
			name: 'Special',
			tools: [
				{ id: 'text', label: 'Text', icon: 'T', shortcut: 'T' },
				{ id: 'gradient', label: 'Gradient', icon: '▱', shortcut: 'G' }
			]
		}
	];
	
	// Filter controls
	let showFilters = false;
	let brightness = 0;
	let contrast = 0;
	let saturation = 0;
	let blur = 0;
	
	/**
	 * Select a tool
	 * @param {string} toolId - The ID of the tool to select
	 */
	function selectTool(toolId) {
		activeTool.set($activeTool === toolId ? null : toolId);
	}
	
	/**
	 * Toggle filters panel
	 */
	function toggleFilters() {
		showFilters = !showFilters;
	}
	
	/**
	 * Apply filters to selected object or all objects
	 */
	function applyFilters() {
		const event = new CustomEvent('applyFilters', {
			detail: { brightness, contrast, saturation, blur }
		});
		window.dispatchEvent(event);
	}
	
	/**
	 * Reset all filters to default values
	 */
	function resetFilters() {
		brightness = 0;
		contrast = 0;
		saturation = 0;
		blur = 0;
		applyFilters();
	}
	
	/**
	 * Open export modal
	 */
	function openExport() {
		showExportModal.set(true);
	}
	
	/**
	 * Undo last action
	 */
	function undo() {
		const event = new CustomEvent('undo');
		window.dispatchEvent(event);
	}
	
	/**
	 * Redo last undone action
	 */
	function redo() {
		const event = new CustomEvent('redo');
		window.dispatchEvent(event);
	}
	
	/**
	 * Toggle left panel collapse state
	 */
	function toggleCollapse() {
		leftPanelCollapsed.set(!$leftPanelCollapsed);
	}
</script>

<!-- Left Toolbar Sidebar -->
<div class="bg-[#2a2a2a] border-r border-[#3a3a3a] {$leftPanelCollapsed ? 'w-12' : 'w-64'} flex flex-col h-full transition-all duration-200">
	<!-- Collapse/Expand Button -->
	<button
		class="p-2 border-b border-[#3a3a3a] text-white hover:bg-[#3a3a3a] transition-colors"
		on:click={toggleCollapse}
		title={$leftPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
	>
		{$leftPanelCollapsed ? '→' : '←'}
	</button>
	
	{#if !$leftPanelCollapsed}
		<!-- Tool Groups -->
		<div class="flex-1 overflow-y-auto p-2">
			{#each toolGroups as group}
				<div class="mb-4">
					<h4 class="text-xs font-semibold text-[#aaa] mb-2 px-2 uppercase">{group.name}</h4>
					<div class="flex flex-col gap-1">
						{#each group.tools as tool}
							<button
								class="flex items-center gap-2 px-3 py-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white cursor-pointer transition-all duration-200 text-sm hover:bg-[#4a4a4a] {$activeTool === tool.id ? 'bg-[#4a90e2] border-[#4a90e2]' : ''}"
								on:click={() => selectTool(tool.id)}
								title="{tool.label} ({tool.shortcut})"
							>
								<span class="text-lg font-bold w-6 text-center">{tool.icon}</span>
								<span class="flex-1 text-left">{tool.label}</span>
								<span class="text-xs text-[#666]">{tool.shortcut}</span>
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
		
		<!-- Action Buttons -->
		<div class="border-t border-[#3a3a3a] p-2 space-y-2">
			<!-- Undo/Redo -->
			<div class="flex gap-1">
				<button
					class="flex-1 px-3 py-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-xs cursor-pointer hover:bg-[#4a4a4a] transition-colors"
					on:click={undo}
					title="Undo (Ctrl+Z)"
				>
					↶ Undo
				</button>
				<button
					class="flex-1 px-3 py-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-xs cursor-pointer hover:bg-[#4a4a4a] transition-colors"
					on:click={redo}
					title="Redo (Ctrl+Shift+Z)"
				>
					↷ Redo
				</button>
			</div>
			
			<!-- Filters Toggle -->
			<button
				class="w-full px-3 py-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-xs cursor-pointer hover:bg-[#4a4a4a] transition-colors {showFilters ? 'bg-[#4a90e2] border-[#4a90e2]' : ''}"
				on:click={toggleFilters}
			>
				Filters
			</button>
			
			<!-- Export Button -->
			<button
				class="w-full px-3 py-2 bg-[#4a90e2] border-none rounded text-white font-semibold text-xs cursor-pointer hover:bg-[#5aa0f2] transition-colors"
				on:click={openExport}
			>
				Export
			</button>
		</div>
		
		<!-- Filters Panel (Collapsible) -->
		{#if showFilters}
			<div class="border-t border-[#3a3a3a] p-3 bg-[#1f1f1f] max-h-64 overflow-y-auto">
				<h4 class="text-xs font-semibold text-[#aaa] mb-3 uppercase">Image Filters</h4>
				<div class="flex flex-col gap-3">
					<div class="flex flex-col gap-1">
						<label for="brightness" class="text-xs text-[#aaa]">Brightness: {brightness}</label>
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
					<div class="flex flex-col gap-1">
						<label for="contrast" class="text-xs text-[#aaa]">Contrast: {contrast}</label>
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
					<div class="flex flex-col gap-1">
						<label for="saturation" class="text-xs text-[#aaa]">Saturation: {saturation}</label>
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
					<div class="flex flex-col gap-1">
						<label for="blur" class="text-xs text-[#aaa]">Blur: {blur}</label>
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
					<button
						class="mt-2 px-3 py-1.5 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-xs cursor-pointer hover:bg-[#4a4a4a] transition-colors"
						on:click={resetFilters}
					>
						Reset Filters
					</button>
				</div>
			</div>
		{/if}
	{:else}
		<!-- Collapsed View - Icon Only -->
		<div class="flex-1 overflow-y-auto p-2">
			{#each toolGroups as group}
				<div class="mb-3">
					{#each group.tools as tool}
						<button
							class="w-full p-2 mb-1 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white cursor-pointer transition-all duration-200 hover:bg-[#4a4a4a] {$activeTool === tool.id ? 'bg-[#4a90e2] border-[#4a90e2]' : ''}"
							on:click={() => selectTool(tool.id)}
							title="{tool.label} ({tool.shortcut})"
						>
							<span class="text-lg">{tool.icon}</span>
						</button>
					{/each}
				</div>
			{/each}
		</div>
		<div class="border-t border-[#3a3a3a] p-2 space-y-1">
			<button
				class="w-full p-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-xs cursor-pointer hover:bg-[#4a4a4a]"
				on:click={undo}
				title="Undo"
			>
				↶
			</button>
			<button
				class="w-full p-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-xs cursor-pointer hover:bg-[#4a4a4a]"
				on:click={redo}
				title="Redo"
			>
				↷
			</button>
			<button
				class="w-full p-2 bg-[#4a90e2] border-none rounded text-white text-xs cursor-pointer hover:bg-[#5aa0f2]"
				on:click={openExport}
				title="Export"
			>
				↓
			</button>
		</div>
	{/if}
</div>
