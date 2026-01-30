<script lang="ts">
	import { get } from 'svelte/store';
	import {
		imageCanvas,
		selectedObjects,
		strokeColor,
		fillColor,
		strokeWidth,
		textColor,
		fontFamily,
		fontSize,
		textAlign
	} from '$lib/stores/imageEditor.store';
	import { applyPropertiesToSelection } from '$lib/utils/fabricTools';

	const readValue = (event: Event) => (event.target as HTMLInputElement).value;
	const readNumber = (event: Event) => Number((event.target as HTMLInputElement).value);
	const readChecked = (event: Event) => (event.target as HTMLInputElement).checked;

	const applyToSelection = (props: Record<string, any>) => {
		const canvas = get(imageCanvas);
		if (!canvas) return;
		applyPropertiesToSelection(canvas, props);
	};

	$: active = $selectedObjects[0] ?? null;
	$: type = active?.type;
	$: multiple = $selectedObjects.length > 1;
</script>

<div class="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-4 text-white space-y-3">
	<h3 class="text-sm font-semibold">Properties</h3>
	{#if !active}
		<p class="text-xs text-[#9aa]">Select a layer to edit properties.</p>
	{:else}
		<div class="grid grid-cols-2 gap-2 text-xs">
			<label class="flex flex-col gap-1">
				X
				<input type="number" value={Math.round(active.left ?? 0)} class="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1"
					on:input={(e) => applyToSelection({ left: readNumber(e) })} />
			</label>
			<label class="flex flex-col gap-1">
				Y
				<input type="number" value={Math.round(active.top ?? 0)} class="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1"
					on:input={(e) => applyToSelection({ top: readNumber(e) })} />
			</label>
			<label class="flex flex-col gap-1">
				W
				<input type="number" value={Math.round(active.getScaledWidth?.() ?? 0)} class="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1"
					on:input={(e) => {
					const value = readNumber(e);
					const scale = value / (active.width || 1);
					applyToSelection({ scaleX: scale });
				}} />
			</label>
			<label class="flex flex-col gap-1">
				H
				<input type="number" value={Math.round(active.getScaledHeight?.() ?? 0)} class="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1"
					on:input={(e) => {
					const value = readNumber(e);
					const scale = value / (active.height || 1);
					applyToSelection({ scaleY: scale });
				}} />
			</label>
			<label class="flex flex-col gap-1">
				Rotate
				<input type="number" value={Math.round(active.angle ?? 0)} class="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1"
					on:input={(e) => applyToSelection({ angle: readNumber(e) })} />
			</label>
			<label class="flex flex-col gap-1">
				Opacity
				<input type="range" min="0" max="1" step="0.05" value={active.opacity ?? 1} on:input={(e) => applyToSelection({ opacity: readNumber(e) })} />
			</label>
		</div>

		{#if multiple}
			<p class="text-xs text-[#9aa]">Multiple selected</p>
		{:else if type === 'textbox'}
			<div class="space-y-2 text-xs">
				<label class="flex flex-col gap-1">
					Text
					<input type="text" value={active.text} class="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1"
						on:input={(e) => applyToSelection({ text: readValue(e) })} />
				</label>
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
					<input type="number" min="8" max="200" bind:value={$fontSize} class="w-20 bg-[#111] border border-[#2a2a2a] rounded px-2 py-1"
						on:input={() => applyToSelection({ fontSize: $fontSize })} />
				</label>
				<label class="flex items-center gap-2">
					Color
					<input type="color" bind:value={$textColor} on:input={(e) => { textColor.set(readValue(e)); applyToSelection({ fill: $textColor }); }} />
				</label>
				<label class="flex items-center gap-2">
					Align
					<select bind:value={$textAlign} class="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1" on:change={() => applyToSelection({ textAlign: $textAlign })}>
						<option value="left">Left</option>
						<option value="center">Center</option>
						<option value="right">Right</option>
					</select>
				</label>
				<label class="flex items-center gap-2">
					Bold
					<input type="checkbox" checked={active.fontWeight === 'bold'} on:change={(e) => applyToSelection({ fontWeight: readChecked(e) ? 'bold' : 'normal' })} />
				</label>
				<label class="flex items-center gap-2">
					Italic
					<input type="checkbox" checked={active.fontStyle === 'italic'} on:change={(e) => applyToSelection({ fontStyle: readChecked(e) ? 'italic' : 'normal' })} />
				</label>
				<label class="flex items-center gap-2">
					Underline
					<input type="checkbox" checked={active.underline} on:change={(e) => applyToSelection({ underline: readChecked(e) })} />
				</label>
			</div>
		{:else if ['rect', 'ellipse', 'circle', 'line'].includes(type)}
			<div class="space-y-2 text-xs">
				<label class="flex items-center gap-2">Fill
					<input type="color" bind:value={$fillColor} on:input={(e) => { fillColor.set(readValue(e)); applyToSelection({ fill: $fillColor }); }} />
				</label>
				<label class="flex items-center gap-2">Stroke
					<input type="color" bind:value={$strokeColor} on:input={(e) => { strokeColor.set(readValue(e)); applyToSelection({ stroke: $strokeColor }); }} />
				</label>
				<label class="flex items-center gap-2">Stroke Width
					<input type="range" min="1" max="40" step="1" bind:value={$strokeWidth} on:input={() => applyToSelection({ strokeWidth: $strokeWidth })} />
				</label>
			</div>
		{:else if type === 'image'}
			<div class="space-y-2 text-xs">
				<label class="flex items-center gap-2">Opacity
					<input type="range" min="0" max="1" step="0.05" value={active.opacity ?? 1} on:input={(e) => applyToSelection({ opacity: readNumber(e) })} />
				</label>
			</div>
		{/if}
	{/if}
</div>
