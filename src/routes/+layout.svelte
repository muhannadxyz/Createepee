<script lang="ts">
	import '../app.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
</script>

<div class="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-[#121212]">
	<Sidebar />
	<main class="flex-1 overflow-auto bg-[#121212]">
		<slot />
	</main>
</div>
