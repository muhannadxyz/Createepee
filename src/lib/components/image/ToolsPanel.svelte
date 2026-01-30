<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { currentTool, shapeVariant, type ImageTool, type ShapeVariant } from '$lib/stores/imageEditor.store';

	type ToolbarItem = {
		id: ImageTool;
		key: string;
		label: string;
		hint: string;
		icon: string;
		group?: {
			type: 'cycle';
			variants: { variant: ShapeVariant; label: string; icon: string; hint: string }[];
		};
	};

	const TOOLBAR: ToolbarItem[] = [
		{ id: 'select', key: 'V', label: 'Move', hint: 'Move & select layers', icon: 'MousePointer2' },
		{ id: 'hand', key: 'H', label: 'Hand', hint: 'Pan the canvas (Space temporarily)', icon: 'Hand' },
		{ id: 'zoom', key: 'Z', label: 'Zoom', hint: 'Ctrl/Cmd + wheel', icon: 'Search' },
		{ id: 'text', key: 'T', label: 'Type', hint: 'Add/edit text', icon: 'Type' },
		{
			id: 'shape',
			key: 'U',
			label: 'Shape',
			hint: 'U cycles: Rect → Ellipse → Line',
			icon: 'Square',
			group: {
				type: 'cycle',
				variants: [
					{ variant: 'rect', label: 'Rectangle Tool', icon: 'Square', hint: 'Shift = constrain' },
					{ variant: 'ellipse', label: 'Ellipse Tool', icon: 'Circle', hint: 'Shift = constrain' },
					{ variant: 'line', label: 'Line Tool', icon: 'Minus', hint: 'Shift = constrain' }
				]
			}
		},
		{ id: 'brush', key: 'B', label: 'Brush', hint: 'Free draw', icon: 'Pencil' },
		{ id: 'eraser', key: 'E', label: 'Eraser', hint: 'Delete object on click', icon: 'Eraser' }
	];

	let toolbarEl: HTMLDivElement;
	let shapeButtonEl: HTMLButtonElement;
	let flyoutEl: HTMLDivElement;
	let showShapeMenu = false;
	let shapeMenuTop = 0;
	let shapeMenuLeft = 0;
	let pressTimer: ReturnType<typeof setTimeout> | null = null;

	const shapeItem = TOOLBAR.find((item) => item.id === 'shape');
	const activeShape = () => shapeItem?.group?.variants.find((variant) => variant.variant === $shapeVariant);

	const openShapeMenu = () => {
		if (!toolbarEl || !shapeButtonEl) return;
		const toolbarRect = toolbarEl.getBoundingClientRect();
		const buttonRect = shapeButtonEl.getBoundingClientRect();
		const estimatedHeight = (shapeItem?.group?.variants.length ?? 3) * 36 + 24;
		const spaceBelow = window.innerHeight - buttonRect.bottom;
		const top = spaceBelow < estimatedHeight
			? buttonRect.bottom - toolbarRect.top - estimatedHeight
			: buttonRect.top - toolbarRect.top;
		shapeMenuTop = Math.max(8, top);
		shapeMenuLeft = buttonRect.right - toolbarRect.left + 8;
		showShapeMenu = true;
	};

	const closeShapeMenu = () => {
		showShapeMenu = false;
	};

	const pickShape = (variant: ShapeVariant) => {
		shapeVariant.set(variant);
		currentTool.set('shape');
		closeShapeMenu();
	};

	const handleShapeContextMenu = (event: MouseEvent) => {
		event.preventDefault();
		openShapeMenu();
	};

	const handleLongPressStart = () => {
		pressTimer = setTimeout(() => {
			openShapeMenu();
		}, 300);
	};

	const handleLongPressEnd = () => {
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
	};

	onMount(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (!showShapeMenu) return;
			const target = event.target as Node;
			if (flyoutEl?.contains(target)) return;
			if (shapeButtonEl?.contains(target)) return;
			closeShapeMenu();
		};

		const handleEsc = (event: KeyboardEvent) => {
			if (event.key === 'Escape') closeShapeMenu();
		};

		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('keydown', handleEsc);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleEsc);
		};
	});
</script>

<div bind:this={toolbarEl} class="h-full w-16 flex flex-col items-center gap-2 bg-[#1b1b1b] border-r border-[#2a2a2a] py-3 relative">
	{#each TOOLBAR as tool}
		{#if tool.id === 'shape'}
			<button
				bind:this={shapeButtonEl}
				class="w-11 h-11 rounded-[10px] flex items-center justify-center border border-[#2a2a2a] transition relative group"
				class:bg-[#0f62fe]={$currentTool === tool.id}
				class:border-[#0f62fe]={$currentTool === tool.id}
				class:hover:bg-[#2b2b2b]={$currentTool !== tool.id}
				on:click={() => currentTool.set('shape')}
				on:contextmenu={handleShapeContextMenu}
				on:pointerdown={handleLongPressStart}
				on:pointerup={handleLongPressEnd}
				on:pointerleave={handleLongPressEnd}
				on:pointercancel={handleLongPressEnd}
			>
				<Icon name={activeShape()?.icon ?? tool.icon} size={22} />
				<span class="absolute bottom-1 right-1 text-[8px] opacity-70">▾</span>
				<span class="absolute top-1 right-1 text-[8px] bg-[#0c0c0c] px-1 rounded">U</span>
				<div class="absolute left-14 top-1/2 -translate-y-1/2 bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[11px] text-white whitespace-nowrap opacity-0 pointer-events-none transition group-hover:opacity-100">
					<div class="font-semibold">{activeShape()?.label ?? 'Shape Tool'}</div>
					<div class="text-[10px] text-[#9aa]">U</div>
					<div class="text-[10px] text-[#9aa]">{activeShape()?.hint ?? tool.hint}</div>
				</div>
			</button>
			{#if showShapeMenu}
				<div
					bind:this={flyoutEl}
					class="absolute bg-[#111] border border-[#2a2a2a] rounded-lg p-2 z-50 space-y-1"
					style={`top: ${shapeMenuTop}px; left: ${shapeMenuLeft}px;`}
				>
					{#each shapeItem?.group?.variants ?? [] as variant}
						<button
							class="w-full flex items-center justify-between gap-3 px-3 py-2 text-xs rounded hover:bg-[#2b2b2b]"
							on:click={() => pickShape(variant.variant)}
						>
							<span class="flex items-center gap-2">
								<Icon name={variant.icon} size={16} />
								<span>{variant.label}</span>
							</span>
							<span class="text-[10px] text-[#9aa]">U</span>
						</button>
					{/each}
				</div>
			{/if}
		{:else}
			<button
				class="w-11 h-11 rounded-[10px] flex items-center justify-center border border-[#2a2a2a] transition relative group"
				class:bg-[#0f62fe]={$currentTool === tool.id}
				class:border-[#0f62fe]={$currentTool === tool.id}
				class:hover:bg-[#2b2b2b]={$currentTool !== tool.id}
				on:click={() => currentTool.set(tool.id)}
			>
				<Icon name={tool.icon} size={22} />
				<span class="absolute top-1 right-1 text-[8px] bg-[#0c0c0c] px-1 rounded">{tool.key}</span>
				<div class="absolute left-14 top-1/2 -translate-y-1/2 bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[11px] text-white whitespace-nowrap opacity-0 pointer-events-none transition group-hover:opacity-100">
					<div class="font-semibold">{tool.label} Tool</div>
					<div class="text-[10px] text-[#9aa]">{tool.key}</div>
					<div class="text-[10px] text-[#9aa]">{tool.hint}</div>
				</div>
			</button>
		{/if}
	{/each}
</div>
