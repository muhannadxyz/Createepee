<script lang="ts">
	import { get } from 'svelte/store';
	import {
		currentTool,
		shapeVariant,
		imageCanvas,
		baseImage,
		selectedObjects,
		strokeColor,
		fillColor,
		strokeWidth,
		textColor,
		brushColor,
		brushSize,
		brushOpacity,
		fontFamily,
		fontSize,
		fontWeight,
		fontStyle,
		textAlign,
		zoomLevel
	} from '$lib/stores/imageEditor.store';
	import { applyPropertiesToSelection } from '$lib/utils/fabricTools';

	const readValue = (event: Event) => (event.target as HTMLInputElement).value;
	const readNumber = (event: Event) => Number((event.target as HTMLInputElement).value);

	const applyToSelection = (props: Record<string, any>) => {
		const canvas = get(imageCanvas);
		if (!canvas) return;
		applyPropertiesToSelection(canvas, props);
	};

	const setZoom = (value: number) => {
		const canvas = get(imageCanvas);
		if (!canvas) return;
		const zoom = Math.min(4, Math.max(0.1, value));
		canvas.zoomToPoint({ x: canvas.getWidth() / 2, y: canvas.getHeight() / 2 } as any, zoom);
		zoomLevel.set(zoom);
	};

	const zoomStep = (direction: 'in' | 'out') => {
		const canvas = get(imageCanvas);
		if (!canvas) return;
		const current = canvas.getZoom();
		const next = direction === 'in' ? current * 1.2 : current / 1.2;
		setZoom(next);
	};

	const fitToScreen = () => {
		const canvas = get(imageCanvas);
		const img = get(baseImage);
		if (!canvas || !img) return;
		const imgWidth = img.getScaledWidth ? img.getScaledWidth() : img.width * (img.scaleX ?? 1);
		const imgHeight = img.getScaledHeight ? img.getScaledHeight() : img.height * (img.scaleY ?? 1);
		const zoom = Math.min(canvas.getWidth() / imgWidth, canvas.getHeight() / imgHeight, 4);
		canvas.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);
		const vpt = canvas.viewportTransform;
		if (vpt) {
			vpt[4] = canvas.getWidth() / 2 - (img.left + imgWidth / 2) * zoom;
			vpt[5] = canvas.getHeight() / 2 - (img.top + imgHeight / 2) * zoom;
			canvas.requestRenderAll();
		}
		zoomLevel.set(zoom);
	};

	const resetZoom = () => setZoom(1);

	const alignSelection = (direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
		const canvas = get(imageCanvas);
		if (!canvas) return;
		const objects = canvas.getActiveObjects();
		if (objects.length < 2) return;
		const bounds = objects.map((obj: any) => obj.getBoundingRect());
		const left = Math.min(...bounds.map((b) => b.left));
		const right = Math.max(...bounds.map((b) => b.left + b.width));
		const top = Math.min(...bounds.map((b) => b.top));
		const bottom = Math.max(...bounds.map((b) => b.top + b.height));
		objects.forEach((obj: any) => {
			if (direction === 'left') obj.left = left;
			if (direction === 'right') obj.left = right - obj.getScaledWidth();
			if (direction === 'center') obj.left = left + (right - left) / 2 - obj.getScaledWidth() / 2;
			if (direction === 'top') obj.top = top;
			if (direction === 'bottom') obj.top = bottom - obj.getScaledHeight();
			if (direction === 'middle') obj.top = top + (bottom - top) / 2 - obj.getScaledHeight() / 2;
			obj.setCoords();
		});
		canvas.requestRenderAll();
	};

	const distributeSelection = (direction: 'horizontal' | 'vertical') => {
		const canvas = get(imageCanvas);
		if (!canvas) return;
		const objects = canvas.getActiveObjects();
		if (objects.length < 3) return;
		const sorted = [...objects].sort((a: any, b: any) => (direction === 'horizontal' ? a.left - b.left : a.top - b.top));
		const first = sorted[0];
		const last = sorted[sorted.length - 1];
		const start = direction === 'horizontal' ? first.left : first.top;
		const end = direction === 'horizontal' ? last.left : last.top;
		const totalSize = sorted.reduce((sum, obj: any) => sum + (direction === 'horizontal' ? obj.getScaledWidth() : obj.getScaledHeight()), 0);
		const gap = (end - start - totalSize) / (sorted.length - 1);
		let cursor = start;
		sorted.forEach((obj: any, index: number) => {
			if (index === 0) {
				cursor += direction === 'horizontal' ? obj.getScaledWidth() + gap : obj.getScaledHeight() + gap;
				return;
			}
			if (direction === 'horizontal') {
				obj.left = cursor;
				cursor += obj.getScaledWidth() + gap;
			} else {
				obj.top = cursor;
				cursor += obj.getScaledHeight() + gap;
			}
			obj.setCoords();
		});
		canvas.requestRenderAll();
	};

	const applyCrop = () => {
		const canvas = get(imageCanvas);
		if (canvas?.__applyCrop) canvas.__applyCrop();
	};

	const cancelCrop = () => {
		const canvas = get(imageCanvas);
		if (canvas?.__cancelCrop) canvas.__cancelCrop();
	};

	$: activeSelection = $selectedObjects[0] ?? null;
	$: isText = activeSelection?.type === 'textbox';
	$: isShape = ['rect', 'ellipse', 'circle', 'line'].includes(activeSelection?.type);
	$: hasMultiple = $selectedObjects.length > 1;
	$: toolLabel = $currentTool === 'shape'
		? `SHAPE — ${$shapeVariant.toUpperCase()} (U)`
		: `${$currentTool.toUpperCase()} (${(
			$currentTool === 'select' ? 'V' :
			$currentTool === 'hand' ? 'H' :
			$currentTool === 'zoom' ? 'Z' :
			$currentTool === 'text' ? 'T' :
			$currentTool === 'brush' ? 'B' :
			$currentTool === 'eraser' ? 'E' :
			$currentTool === 'crop' ? 'C' :
			$currentTool === 'eyedropper' ? 'I' :
			''
		).toUpperCase()})`;
	$: canvasSize = $imageCanvas ? `${Math.round($imageCanvas.getWidth())}×${Math.round($imageCanvas.getHeight())}` : '';
</script>

<div class="w-full bg-[#1c1c1c] border-b border-[#2a2a2a] text-white px-3 py-2 flex flex-wrap items-center gap-3 text-xs">
	<div class="flex items-center gap-2">
		<span class="text-[#9aa]">{toolLabel}</span>
	</div>

	{#if $currentTool === 'select'}
		<div class="flex items-center gap-2">
			<label class="flex items-center gap-2">Opacity
				<input type="range" min="0" max="1" step="0.05" value={activeSelection?.opacity ?? 1} on:input={(e) => applyToSelection({ opacity: readNumber(e) })} />
			</label>
			{#if hasMultiple}
				<div class="flex items-center gap-1">
					<button class="px-2 py-1 rounded border border-[#2a2a2a]" on:click={() => alignSelection('left')}>Left</button>
					<button class="px-2 py-1 rounded border border-[#2a2a2a]" on:click={() => alignSelection('center')}>Center</button>
					<button class="px-2 py-1 rounded border border-[#2a2a2a]" on:click={() => alignSelection('right')}>Right</button>
					<button class="px-2 py-1 rounded border border-[#2a2a2a]" on:click={() => alignSelection('top')}>Top</button>
					<button class="px-2 py-1 rounded border border-[#2a2a2a]" on:click={() => alignSelection('middle')}>Middle</button>
					<button class="px-2 py-1 rounded border border-[#2a2a2a]" on:click={() => alignSelection('bottom')}>Bottom</button>
					<button class="px-2 py-1 rounded border border-[#2a2a2a]" on:click={() => distributeSelection('horizontal')}>Dist H</button>
					<button class="px-2 py-1 rounded border border-[#2a2a2a]" on:click={() => distributeSelection('vertical')}>Dist V</button>
				</div>
			{/if}
		</div>
	{:else if $currentTool === 'text' || (isText && $currentTool === 'select')}
		<div class="flex items-center gap-2">
			<label class="flex items-center gap-2">
				Font
				<select bind:value={$fontFamily} class="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1" on:change={() => applyToSelection({ fontFamily: $fontFamily })}>
					<option>Arial</option>
					<option>Helvetica</option>
					<option>Times New Roman</option>
					<option>Courier New</option>
				</select>
			</label>
			<label class="flex items-center gap-2">
				Size
				<input type="number" min="8" max="200" bind:value={$fontSize} class="w-16 bg-[#111] border border-[#2a2a2a] rounded px-2 py-1"
					on:input={() => applyToSelection({ fontSize: $fontSize })} />
			</label>
			<button class="px-2 py-1 rounded border border-[#2a2a2a]" on:click={() => {
				const next = $fontWeight === 'bold' ? 'normal' : 'bold';
				fontWeight.set(next);
				applyToSelection({ fontWeight: next });
			}}>
				B
			</button>
			<button class="px-2 py-1 rounded border border-[#2a2a2a]" on:click={() => {
				const next = $fontStyle === 'italic' ? 'normal' : 'italic';
				fontStyle.set(next);
				applyToSelection({ fontStyle: next });
			}}>
				I
			</button>
			<label class="flex items-center gap-2">
				Align
				<select bind:value={$textAlign} class="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1" on:change={() => applyToSelection({ textAlign: $textAlign })}>
					<option value="left">Left</option>
					<option value="center">Center</option>
					<option value="right">Right</option>
				</select>
			</label>
			<label class="flex items-center gap-2">
				Color
				<input type="color" bind:value={$textColor} on:input={(e) => { textColor.set(readValue(e)); applyToSelection({ fill: $textColor }); }} />
			</label>
		</div>
	{:else if $currentTool === 'shape' || (isShape && $currentTool === 'select')}
		<div class="flex items-center gap-2">
			<span class="text-[#9aa]">Variant:</span>
			<span class="uppercase">{$shapeVariant}</span>
			<label class="flex items-center gap-2">Fill
				<input type="color" bind:value={$fillColor} on:input={(e) => { fillColor.set(readValue(e)); applyToSelection({ fill: $fillColor }); }} />
			</label>
			<label class="flex items-center gap-2">Stroke
				<input type="color" bind:value={$strokeColor} on:input={(e) => { strokeColor.set(readValue(e)); applyToSelection({ stroke: $strokeColor }); }} />
			</label>
			<label class="flex items-center gap-2">Width
				<input type="range" min="1" max="40" step="1" bind:value={$strokeWidth} on:input={() => applyToSelection({ strokeWidth: $strokeWidth })} />
			</label>
			<label class="flex items-center gap-2">Opacity
				<input type="range" min="0" max="1" step="0.05" value={activeSelection?.opacity ?? 1} on:input={(e) => applyToSelection({ opacity: readNumber(e) })} />
			</label>
		</div>
	{:else if $currentTool === 'brush'}
		<div class="flex items-center gap-2">
			<label class="flex items-center gap-2">Size
				<input type="range" min="1" max="100" step="1" bind:value={$brushSize} />
				<span>{$brushSize}px</span>
			</label>
			<label class="flex items-center gap-2">Opacity
				<input type="range" min="0.1" max="1" step="0.05" bind:value={$brushOpacity} />
			</label>
			<label class="flex items-center gap-2">Color
				<input type="color" bind:value={$brushColor} />
			</label>
		</div>
	{:else if $currentTool === 'zoom'}
		<div class="flex items-center gap-2">
			<button class="px-2 py-1 rounded border border-[#2a2a2a]" on:click={() => zoomStep('out')}>-</button>
			<select class="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1" on:change={(e) => setZoom(readNumber(e) / 100)}>
				<option value="25">25%</option>
				<option value="50">50%</option>
				<option value="100" selected>100%</option>
				<option value="200">200%</option>
				<option value="400">400%</option>
			</select>
			<button class="px-2 py-1 rounded border border-[#2a2a2a]" on:click={() => zoomStep('in')}>+</button>
			<button class="px-2 py-1 rounded border border-[#2a2a2a]" on:click={resetZoom}>100%</button>
			<button class="px-2 py-1 rounded border border-[#2a2a2a]" on:click={fitToScreen}>Fit</button>
		</div>
	{:else if $currentTool === 'crop'}
		<div class="flex items-center gap-2">
			<button class="px-2 py-1 rounded border border-[#2a2a2a]" on:click={applyCrop}>Apply Crop</button>
			<button class="px-2 py-1 rounded border border-[#2a2a2a]" on:click={cancelCrop}>Cancel</button>
			<span class="text-[#9aa]">Drag to resize crop box</span>
		</div>
	{:else if $currentTool === 'eyedropper'}
		<div class="flex items-center gap-2">
			<span class="text-[#9aa]">Click canvas to sample color</span>
		</div>
	{/if}

	<div class="ml-auto flex items-center gap-3 text-[#9aa]">
		<span>Zoom <span class="text-white">{Math.round($zoomLevel * 100)}%</span></span>
		{#if canvasSize}
			<span>{canvasSize}</span>
		{/if}
	</div>
</div>
