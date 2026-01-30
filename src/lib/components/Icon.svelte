<script lang="ts">
	import {
		MousePointer2,
		Hand,
		Search,
		Type,
		Square,
		Circle,
		Minus,
		Pencil,
		Eraser
	} from 'lucide-svelte';

	export let name: string;
	export let size = 20;
	export let strokeWidth = 1.8;
	const icons: Record<string, any> = {
		MousePointer2,
		Hand,
		Search,
		Type,
		Square,
		Circle,
		Minus,
		Pencil,
		Eraser
	};

	$: IconComponent = icons[name] ?? MousePointer2;
</script>

<svelte:component this={IconComponent} {size} {strokeWidth} />
