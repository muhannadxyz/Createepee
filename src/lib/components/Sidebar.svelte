<script lang="ts">
	import { page } from '$app/stores';

	const links = [
		{ href: '/image', label: 'Image Editor' },
		{ href: '/video', label: 'Video Editor' },
		{ href: '/docs', label: 'Document Tools' },
		{ href: '/convert', label: 'File Converters' }
	];
</script>

<aside class="w-full md:w-64 bg-[#222] border-r border-[#333] text-white flex-shrink-0">
	<div class="p-5 border-b border-[#333]">
		<h1 class="text-xl font-semibold">Createepee</h1>
		<p class="text-xs text-[#9aa] mt-1">Creative tools, no signup</p>
	</div>
	<nav class="p-3 flex md:flex-col gap-2 md:gap-1 overflow-x-auto">
		{#each links as link}
			<a
				href={link.href}
				class="min-w-[150px] md:min-w-0 px-4 py-3 rounded-lg border border-transparent transition-all duration-200 text-sm md:text-base whitespace-nowrap"
				class:font-semibold={$page.url.pathname === link.href}
				class:bg-[#0f62fe]={$page.url.pathname === link.href}
				class:border-[#0f62fe]={$page.url.pathname === link.href}
				class:bg-[#2b2b2b]={$page.url.pathname !== link.href}
				class:hover:bg-[#333]={$page.url.pathname !== link.href}
			>
				{link.label}
			</a>
		{/each}
	</nav>
</aside>
