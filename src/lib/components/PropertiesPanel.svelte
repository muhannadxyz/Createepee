<script>
	import { 
		canvasInstance, 
		activeTool,
		brushSize,
		brushOpacity,
		brushFlow,
		brushHardness,
		brushColor,
		gradientStartColor,
		gradientEndColor,
		gradientType,
		gradientAngle,
		fillColor,
		strokeColor,
		strokeWidth as strokeWidthStore
	} from '$lib/stores/editorStore.js';
	
	/**
	 * PropertiesPanel Component
	 * 
	 * Context-sensitive properties panel that shows different options
	 * based on the selected tool or object, similar to Photoshop/Affinity.
	 * 
	 * Features:
	 * - Transform properties (position, size, rotation, skew)
	 * - Color properties (fill, stroke)
	 * - Text properties (font, size, alignment)
	 * - Brush properties (size, opacity, flow)
	 * - Gradient properties (type, colors, angle)
	 */
	
	// Transform properties
	let positionX = 0;
	let positionY = 0;
	let width = 0;
	let height = 0;
	let rotation = 0;
	let scaleX = 1;
	let scaleY = 1;
	
	// Color properties are now in stores, but we need local copies for the reactive updates
	let localFillColor = $fillColor;
	let localStrokeColor = $strokeColor;
	let localStrokeWidth = $strokeWidthStore;
	
	// Text properties
	let fontSize = 20;
	let fontFamily = 'Arial';
	let textAlign = 'left';
	
	// Brush and gradient properties are now managed in the store
	
	/**
	 * Reactive statement to update properties when active object changes
	 */
	$: if ($canvasInstance) {
		const activeObject = $canvasInstance.getActiveObject();
		if (activeObject) {
			// Update transform properties
			positionX = Math.round(activeObject.left || 0);
			positionY = Math.round(activeObject.top || 0);
			width = Math.round(activeObject.width * (activeObject.scaleX || 1));
			height = Math.round(activeObject.height * (activeObject.scaleY || 1));
			rotation = Math.round(activeObject.angle || 0);
			scaleX = activeObject.scaleX || 1;
			scaleY = activeObject.scaleY || 1;
			
			// Update color properties
			// Convert 'transparent' to a valid hex color for color inputs
			// Color inputs require hex format (#rrggbb), so we convert transparent to white
			const fill = activeObject.fill;
			if (fill === 'transparent' || fill === null || fill === undefined || fill === '') {
				localFillColor = '#ffffff'; // Default to white for color input
				fillColor.set('#ffffff');
			} else if (typeof fill === 'string' && fill.startsWith('#')) {
				localFillColor = fill.substring(0, 7); // Take only RGB part, ignore alpha if present
				fillColor.set(localFillColor);
			} else {
				localFillColor = '#ffffff'; // Default fallback
				fillColor.set('#ffffff');
			}
			
			const stroke = activeObject.stroke;
			if (stroke === 'transparent' || stroke === null || stroke === undefined || stroke === '') {
				localStrokeColor = '#000000'; // Default to black for color input
				strokeColor.set('#000000');
			} else if (typeof stroke === 'string' && stroke.startsWith('#')) {
				localStrokeColor = stroke.substring(0, 7); // Take only RGB part
				strokeColor.set(localStrokeColor);
			} else {
				localStrokeColor = '#000000'; // Default fallback
				strokeColor.set('#000000');
			}
			
			localStrokeWidth = activeObject.strokeWidth || 2;
			strokeWidthStore.set(localStrokeWidth);
			
			// Update text properties if it's a text object
			if (activeObject.type === 'textbox' || activeObject.type === 'text') {
				fontSize = activeObject.fontSize || 20;
				fontFamily = activeObject.fontFamily || 'Arial';
				textAlign = activeObject.textAlign || 'left';
			}
		}
	}
	
	/**
	 * Update object transform properties
	 */
	function updateTransform() {
		if (!$canvasInstance) return;
		const activeObject = $canvasInstance.getActiveObject();
		if (!activeObject) return;
		
		activeObject.set({
			left: positionX,
			top: positionY,
			angle: rotation,
			scaleX: scaleX,
			scaleY: scaleY
		});
		
		$canvasInstance.renderAll();
	}
	
	/**
	 * Update object color properties
	 */
	function updateColors() {
		if (!$canvasInstance) return;
		const activeObject = $canvasInstance.getActiveObject();
		if (!activeObject) return;
		
		// Update stores and object
		fillColor.set(localFillColor);
		strokeColor.set(localStrokeColor);
		strokeWidthStore.set(localStrokeWidth);
		
		// Update colors - fillColor and strokeColor are always valid hex colors from the input
		activeObject.set({
			fill: localFillColor || '#ffffff',
			stroke: localStrokeColor || '#000000',
			strokeWidth: localStrokeWidth
		});
		
		$canvasInstance.renderAll();
	}
	
	// Sync local values with stores
	$: if ($fillColor !== localFillColor && !$canvasInstance?.getActiveObject()) {
		localFillColor = $fillColor;
	}
	$: if ($strokeColor !== localStrokeColor && !$canvasInstance?.getActiveObject()) {
		localStrokeColor = $strokeColor;
	}
	$: if ($strokeWidthStore !== localStrokeWidth && !$canvasInstance?.getActiveObject()) {
		localStrokeWidth = $strokeWidthStore;
	}
	
	/**
	 * Update text properties
	 */
	function updateText() {
		if (!$canvasInstance) return;
		const activeObject = $canvasInstance.getActiveObject();
		if (!activeObject || (activeObject.type !== 'textbox' && activeObject.type !== 'text')) return;
		
		activeObject.set({
			fontSize: fontSize,
			fontFamily: fontFamily,
			textAlign: textAlign
		});
		
		$canvasInstance.renderAll();
	}
	
	/**
	 * Update brush properties (affects free drawing)
	 * Properties are automatically synced via stores
	 */
	function updateBrush() {
		// Brush properties are reactive via stores, no action needed
		// The ImageEditor component will react to store changes
	}
	
	/**
	 * Get the current active object
	 */
	$: activeObject = $canvasInstance ? $canvasInstance.getActiveObject() : null;
	
	/**
	 * Determine which properties section to show based on active tool or object
	 */
	$: showTransform = activeObject && ($activeTool === 'select' || !$activeTool);
	$: showColors = activeObject && (activeObject.type !== 'textbox' && activeObject.type !== 'text');
	$: showText = activeObject && (activeObject.type === 'textbox' || activeObject.type === 'text');
	$: showBrush = $activeTool === 'freedraw' || $activeTool === 'brush';
	$: showGradient = $activeTool === 'gradient';
</script>

<div class="bg-[#2a2a2a] border-l border-[#3a3a3a] w-64 flex flex-col h-full overflow-y-auto">
	<!-- Panel Header -->
	<div class="p-3 border-b border-[#3a3a3a]">
		<h3 class="text-sm font-semibold text-white m-0">Properties</h3>
	</div>
	
	<!-- Transform Properties -->
	{#if showTransform}
		<div class="p-3 border-b border-[#3a3a3a]">
			<h4 class="text-xs font-semibold text-[#aaa] mb-2 uppercase">Transform</h4>
			<div class="flex flex-col gap-2">
				<div class="flex gap-2">
					<div class="flex-1">
						<label class="text-xs text-[#aaa] block mb-1">X</label>
						<input
							type="number"
							bind:value={positionX}
							on:input={updateTransform}
							class="w-full px-2 py-1 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-xs"
						/>
					</div>
					<div class="flex-1">
						<label class="text-xs text-[#aaa] block mb-1">Y</label>
						<input
							type="number"
							bind:value={positionY}
							on:input={updateTransform}
							class="w-full px-2 py-1 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-xs"
						/>
					</div>
				</div>
				<div class="flex gap-2">
					<div class="flex-1">
						<label class="text-xs text-[#aaa] block mb-1">Width</label>
						<input
							type="number"
							bind:value={width}
							on:input={updateTransform}
							class="w-full px-2 py-1 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-xs"
						/>
					</div>
					<div class="flex-1">
						<label class="text-xs text-[#aaa] block mb-1">Height</label>
						<input
							type="number"
							bind:value={height}
							on:input={updateTransform}
							class="w-full px-2 py-1 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-xs"
						/>
					</div>
				</div>
				<div>
					<label class="text-xs text-[#aaa] block mb-1">Rotation: {rotation}°</label>
					<input
						type="range"
						min="-180"
						max="180"
						bind:value={rotation}
						on:input={updateTransform}
						class="w-full"
					/>
				</div>
				<div class="flex gap-2">
					<div class="flex-1">
						<label class="text-xs text-[#aaa] block mb-1">Scale X: {Math.round(scaleX * 100)}%</label>
						<input
							type="range"
							min="0.1"
							max="3"
							step="0.1"
							bind:value={scaleX}
							on:input={updateTransform}
							class="w-full"
						/>
					</div>
					<div class="flex-1">
						<label class="text-xs text-[#aaa] block mb-1">Scale Y: {Math.round(scaleY * 100)}%</label>
						<input
							type="range"
							min="0.1"
							max="3"
							step="0.1"
							bind:value={scaleY}
							on:input={updateTransform}
							class="w-full"
						/>
					</div>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Color Properties -->
	{#if showColors}
		<div class="p-3 border-b border-[#3a3a3a]">
			<h4 class="text-xs font-semibold text-[#aaa] mb-2 uppercase">Colors</h4>
			<div class="flex flex-col gap-2">
				<div>
					<label for="fill-color-prop" class="text-xs text-[#aaa] block mb-1">Fill</label>
					<input
						id="fill-color-prop"
						type="color"
						bind:value={localFillColor}
						on:input={updateColors}
						class="w-full h-8 border border-[#4a4a4a] rounded cursor-pointer"
					/>
				</div>
				<div>
					<label for="stroke-color-prop" class="text-xs text-[#aaa] block mb-1">Stroke</label>
					<input
						id="stroke-color-prop"
						type="color"
						bind:value={localStrokeColor}
						on:input={updateColors}
						class="w-full h-8 border border-[#4a4a4a] rounded cursor-pointer"
					/>
				</div>
				<div>
					<label for="stroke-width-prop" class="text-xs text-[#aaa] block mb-1">Stroke Width: {localStrokeWidth}</label>
					<input
						id="stroke-width-prop"
						type="range"
						min="1"
						max="20"
						bind:value={localStrokeWidth}
						on:input={updateColors}
						class="w-full"
					/>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Text Properties -->
	{#if showText}
		<div class="p-3 border-b border-[#3a3a3a]">
			<h4 class="text-xs font-semibold text-[#aaa] mb-2 uppercase">Text</h4>
			<div class="flex flex-col gap-2">
				<div>
					<label class="text-xs text-[#aaa] block mb-1">Font Size: {fontSize}</label>
					<input
						type="range"
						min="10"
						max="100"
						bind:value={fontSize}
						on:input={updateText}
						class="w-full"
					/>
				</div>
				<div>
					<label class="text-xs text-[#aaa] block mb-1">Font Family</label>
					<select
						bind:value={fontFamily}
						on:change={updateText}
						class="w-full px-2 py-1 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-xs"
					>
						<option value="Arial">Arial</option>
						<option value="Times New Roman">Times New Roman</option>
						<option value="Courier New">Courier New</option>
						<option value="Georgia">Georgia</option>
						<option value="Verdana">Verdana</option>
					</select>
				</div>
				<div>
					<label class="text-xs text-[#aaa] block mb-1">Alignment</label>
					<select
						bind:value={textAlign}
						on:change={updateText}
						class="w-full px-2 py-1 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-xs"
					>
						<option value="left">Left</option>
						<option value="center">Center</option>
						<option value="right">Right</option>
						<option value="justify">Justify</option>
					</select>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Brush Properties -->
	{#if showBrush}
		<div class="p-3 border-b border-[#3a3a3a]">
			<h4 class="text-xs font-semibold text-[#aaa] mb-2 uppercase">Brush</h4>
			<div class="flex flex-col gap-2">
				<div>
					<label class="text-xs text-[#aaa] block mb-1">Size: {$brushSize}</label>
					<input
						type="range"
						min="1"
						max="50"
						bind:value={$brushSize}
						class="w-full"
					/>
				</div>
				<div>
					<label class="text-xs text-[#aaa] block mb-1">Opacity: {$brushOpacity}%</label>
					<input
						type="range"
						min="0"
						max="100"
						bind:value={$brushOpacity}
						class="w-full"
					/>
				</div>
				<div>
					<label class="text-xs text-[#aaa] block mb-1">Flow: {$brushFlow}%</label>
					<input
						type="range"
						min="0"
						max="100"
						bind:value={$brushFlow}
						class="w-full"
					/>
				</div>
				<div>
					<label class="text-xs text-[#aaa] block mb-1">Hardness: {$brushHardness}%</label>
					<input
						type="range"
						min="0"
						max="100"
						bind:value={$brushHardness}
						class="w-full"
					/>
				</div>
				<div>
					<label class="text-xs text-[#aaa] block mb-1">Color</label>
					<input
						type="color"
						bind:value={$brushColor}
						class="w-full h-8 border border-[#4a4a4a] rounded cursor-pointer"
					/>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Gradient Properties -->
	{#if showGradient}
		<div class="p-3 border-b border-[#3a3a3a]">
			<h4 class="text-xs font-semibold text-[#aaa] mb-2 uppercase">Gradient</h4>
			<div class="flex flex-col gap-2">
				<div>
					<label class="text-xs text-[#aaa] block mb-1">Type</label>
					<select
						bind:value={$gradientType}
						class="w-full px-2 py-1 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-xs"
					>
						<option value="linear">Linear</option>
						<option value="radial">Radial</option>
					</select>
				</div>
				<div>
					<label class="text-xs text-[#aaa] block mb-1">Start Color</label>
					<input
						type="color"
						bind:value={$gradientStartColor}
						class="w-full h-8 border border-[#4a4a4a] rounded cursor-pointer"
					/>
				</div>
				<div>
					<label class="text-xs text-[#aaa] block mb-1">End Color</label>
					<input
						type="color"
						bind:value={$gradientEndColor}
						class="w-full h-8 border border-[#4a4a4a] rounded cursor-pointer"
					/>
				</div>
				<div>
					<label class="text-xs text-[#aaa] block mb-1">Angle: {$gradientAngle}°</label>
					<input
						type="range"
						min="0"
						max="360"
						bind:value={$gradientAngle}
						class="w-full"
					/>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Empty State -->
	{#if !showTransform && !showColors && !showText && !showBrush && !showGradient}
		<div class="p-4 text-center text-sm text-[#aaa]">
			Select an object or tool to see properties
		</div>
	{/if}
</div>

