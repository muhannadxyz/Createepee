<script>
	import { activeTool, videoFile, videoClips, showExportModal, processedVideoPath } from '$lib/stores/editorStore.js';
	import * as videoUtils from '$lib/utils/videoUtils.js';
	
	const tools = [
		{ id: 'trim', label: 'Trim' },
		{ id: 'merge', label: 'Merge' },
		{ id: 'text', label: 'Add Text' },
		{ id: 'audio', label: 'Add Audio' }
	];
	
	let trimStart = 0;
	let trimEnd = 0;
	let textContent = '';
	let textX = 50;
	let textY = 50;
	let textSize = 24;
	let textColor = '#ffffff';
	let audioFile = null;
	let loading = false;
	let error = null;
	let currentVideoPath = null;
	
	function selectTool(toolId) {
		activeTool.set($activeTool === toolId ? null : toolId);
	}
	
	async function handleTrim() {
		if (!currentVideoPath) {
			error = 'Please upload a video first';
			return;
		}
		
		loading = true;
		error = null;
		
		try {
			const result = await videoUtils.trimVideo(currentVideoPath, trimStart, trimEnd);
			processedVideoPath.set(result.filePath);
			error = null;
			alert('Video trimmed successfully!');
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}
	
	async function handleAddVideo() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'video/*';
		input.onchange = async (e) => {
			const file = e.target.files[0];
			if (file) {
				loading = true;
				try {
					const result = await videoUtils.uploadVideo(file);
					videoClips.update(clips => [...clips, { file, path: result.filePath }]);
					if (!currentVideoPath) {
						currentVideoPath = result.filePath;
					}
				} catch (err) {
					error = err.message;
				} finally {
					loading = false;
				}
			}
		};
		input.click();
	}
	
	async function handleMerge() {
		if ($videoClips.length < 2) {
			error = 'Please add at least 2 videos to merge';
			return;
		}
		
		loading = true;
		error = null;
		
		try {
			const filePaths = $videoClips.map(clip => clip.path || clip.filePath);
			const result = await videoUtils.mergeVideos(filePaths);
			processedVideoPath.set(result.filePath);
			error = null;
			alert('Videos merged successfully!');
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}
	
	async function handleAddText() {
		if (!currentVideoPath || !textContent) {
			error = 'Please upload a video and enter text';
			return;
		}
		
		loading = true;
		error = null;
		
		try {
			const result = await videoUtils.addTextToVideo(
				currentVideoPath,
				textContent,
				textX,
				textY,
				textSize,
				textColor
			);
			processedVideoPath.set(result.filePath);
			error = null;
			alert('Text added successfully!');
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}
	
	async function handleAddAudio() {
		if (!currentVideoPath) {
			error = 'Please upload a video first';
			return;
		}
		
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'audio/*';
		input.onchange = async (e) => {
			audioFile = e.target.files[0];
			if (audioFile) {
				loading = true;
				error = null;
				
				try {
					const audioResult = await videoUtils.uploadVideo(audioFile);
					const result = await videoUtils.addAudioToVideo(currentVideoPath, audioResult.filePath);
					processedVideoPath.set(result.filePath);
					error = null;
					alert('Audio added successfully!');
				} catch (err) {
					error = err.message;
				} finally {
					loading = false;
				}
			}
		};
		input.click();
	}
</script>

<div class="bg-[#2a2a2a] border-b border-[#3a3a3a] p-4 flex gap-8 items-center">
	<div class="flex items-center gap-4">
		<h3 class="m-0 text-sm text-[#aaa] font-medium">Video Tools</h3>
		<div class="flex gap-2">
			{#each tools as tool}
				<button 
					class="px-6 py-3 bg-[#3a3a3a] border border-[#4a4a4a] rounded-md text-white cursor-pointer transition-all duration-200 text-sm hover:bg-[#4a4a4a] {$activeTool === tool.id ? 'bg-[#4a90e2] border-[#4a90e2]' : ''}"
					on:click={() => selectTool(tool.id)}
				>
					{tool.label}
				</button>
			{/each}
		</div>
	</div>
	
	{#if $activeTool === 'trim'}
		<div class="bg-[#2a2a2a] border-t border-[#3a3a3a] p-4">
			<h4 class="m-0 mb-4 text-base">Trim Video</h4>
			<div class="flex flex-col gap-4">
				<label class="flex flex-col gap-2 text-sm text-[#aaa]">
					Start Time (seconds):
					<input type="number" bind:value={trimStart} min="0" step="0.1" class="p-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-sm" />
				</label>
				<label class="flex flex-col gap-2 text-sm text-[#aaa]">
					End Time (seconds):
					<input type="number" bind:value={trimEnd} min="0" step="0.1" class="p-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-sm" />
				</label>
				<button class="px-6 py-3 bg-[#4a90e2] border-none rounded-md text-white font-semibold cursor-pointer transition-all duration-200 hover:bg-[#5aa0f2]" on:click={handleTrim}>Apply Trim</button>
			</div>
		</div>
	{:else if $activeTool === 'merge'}
		<div class="bg-[#2a2a2a] border-t border-[#3a3a3a] p-4">
			<h4 class="m-0 mb-4 text-base">Merge Videos</h4>
			<div class="flex flex-col gap-4">
				<button class="px-6 py-3 bg-[#4a90e2] border-none rounded-md text-white font-semibold cursor-pointer transition-all duration-200 hover:bg-[#5aa0f2]" on:click={handleAddVideo}>Add Video</button>
				<div class="flex flex-col gap-2 max-h-[150px] overflow-y-auto">
					{#each $videoClips as clip, i}
						<div class="p-2 bg-[#3a3a3a] rounded text-sm">Video {i + 1}: {clip.name}</div>
					{/each}
				</div>
				<button class="px-6 py-3 bg-[#4a90e2] border-none rounded-md text-white font-semibold cursor-pointer transition-all duration-200 hover:bg-[#5aa0f2]" on:click={handleMerge}>Merge Videos</button>
			</div>
		</div>
	{:else if $activeTool === 'text'}
		<div class="bg-[#2a2a2a] border-t border-[#3a3a3a] p-4">
			<h4 class="m-0 mb-4 text-base">Add Text Overlay</h4>
			<div class="flex flex-col gap-4">
				<label class="flex flex-col gap-2 text-sm text-[#aaa]">
					Text:
					<input type="text" bind:value={textContent} placeholder="Enter text" class="p-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-sm" />
				</label>
				<label class="flex flex-col gap-2 text-sm text-[#aaa]">
					X Position:
					<input type="number" bind:value={textX} min="0" max="100" class="p-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-sm" />
				</label>
				<label class="flex flex-col gap-2 text-sm text-[#aaa]">
					Y Position:
					<input type="number" bind:value={textY} min="0" max="100" class="p-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-sm" />
				</label>
				<label class="flex flex-col gap-2 text-sm text-[#aaa]">
					Size:
					<input type="number" bind:value={textSize} min="10" max="100" class="p-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-sm" />
				</label>
				<label class="flex flex-col gap-2 text-sm text-[#aaa]">
					Color:
					<input type="color" bind:value={textColor} class="h-10 bg-[#3a3a3a] border border-[#4a4a4a] rounded cursor-pointer" />
				</label>
				<button class="px-6 py-3 bg-[#4a90e2] border-none rounded-md text-white font-semibold cursor-pointer transition-all duration-200 hover:bg-[#5aa0f2]" on:click={handleAddText}>Add Text</button>
			</div>
		</div>
	{:else if $activeTool === 'audio'}
		<div class="bg-[#2a2a2a] border-t border-[#3a3a3a] p-4">
			<h4 class="m-0 mb-4 text-base">Add Audio Track</h4>
			<div class="flex flex-col gap-4">
				<button class="px-6 py-3 bg-[#4a90e2] border-none rounded-md text-white font-semibold cursor-pointer transition-all duration-200 hover:bg-[#5aa0f2]" on:click={handleAddAudio}>Select Audio File</button>
				{#if audioFile}
					<div class="p-2 bg-[#3a3a3a] rounded text-sm">Selected: {audioFile.name}</div>
				{/if}
			</div>
		</div>
	{/if}
	
	<div class="flex items-center gap-4">
		{#if loading}
			<div class="text-[#4a90e2] text-sm">Processing...</div>
		{/if}
		{#if error}
			<div class="text-[#ff4444] text-sm">{error}</div>
		{/if}
		<button 
			class="px-6 py-3 bg-[#4a90e2] border-none rounded-md text-white font-semibold cursor-pointer transition-all duration-200 hover:bg-[#5aa0f2] disabled:opacity-50 disabled:cursor-not-allowed" 
			on:click={() => showExportModal.set(true)}
			disabled={!$processedVideoPath}
		>
			Export
		</button>
	</div>
</div>


