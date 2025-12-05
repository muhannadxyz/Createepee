<script>
	import '../app.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
</script>

<div class="flex h-screen w-full overflow-hidden">
	<Sidebar />
	<main class="flex-1 overflow-auto bg-[#1a1a1a] w-full">
		<slot />
	</main>
</div>
