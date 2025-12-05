<script>
	import { editorMode } from '$lib/stores/editorStore.js';

	function switchMode(mode) {
		editorMode.set(mode);
	}

	const categories = [
		{ id: 'image', label: 'Image Editor', icon: '🖼️' },
		{ id: 'video', label: 'Video Editor', icon: '🎬' },
		{ id: 'document', label: 'Document Tools', icon: '📄' },
		{ id: 'converter', label: 'File Converters', icon: '🔄' }
	];
</script>

<aside class="w-[250px] bg-[#2a2a2a] border-r border-[#3a3a3a] flex flex-col text-white">
	<div class="p-6 border-b border-[#3a3a3a]">
		<h1 class="m-0 text-2xl font-semibold">Editor Hub</h1>
	</div>
	<nav class="p-4 flex flex-col gap-2">
		{#each categories as category}
			<button 
				class="flex items-center gap-3 p-4 bg-transparent border border-[#3a3a3a] rounded-lg text-white cursor-pointer transition-all duration-200 text-base hover:bg-[#3a3a3a] hover:border-[#4a4a4a] {$editorMode === category.id ? 'bg-[#4a90e2] border-[#4a90e2]' : ''}"
				on:click={() => switchMode(category.id)}
			>
				<span class="text-2xl">{category.icon}</span>
				<span class="font-medium">{category.label}</span>
			</button>
		{/each}
	</nav>
</aside>

