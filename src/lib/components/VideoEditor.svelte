<script>
	import { onMount } from 'svelte';
	import { videoFile, videoClips, processedVideoPath } from '$lib/stores/editorStore.js';
	import VideoToolbar from './VideoToolbar.svelte';
	
	let videoElement;
	let videoUrl = '';
	let isPlaying = false;
	let currentTime = 0;
	let duration = 0;
	let timelineRef;
	let isDragging = false;

	onMount(() => {
		return () => {
			if (videoUrl) {
				URL.revokeObjectURL(videoUrl);
			}
		};
	});

	import * as videoUtils from '$lib/utils/videoUtils.js';
	
	let uploading = false;
	let uploadError = null;
	let currentVideoPath = null;

	async function handleVideoUpload(event) {
		const file = event.target.files[0];
		if (!file) return;
		
		if (!file.type.startsWith('video/')) {
			alert('Please upload a video file');
			return;
		}
		
		uploading = true;
		uploadError = null;
		
		try {
			const result = await videoUtils.uploadVideo(file);
			currentVideoPath = result.filePath;
			processedVideoPath.set(result.filePath); // Set initial processed path
			videoFile.set(file);
			
			if (videoUrl) {
				URL.revokeObjectURL(videoUrl);
			}
			
			videoUrl = URL.createObjectURL(file);
		} catch (err) {
			uploadError = err.message;
			alert('Failed to upload video: ' + err.message);
		} finally {
			uploading = false;
		}
	}

	function handleTimeUpdate() {
		if (videoElement && !isDragging) {
			currentTime = videoElement.currentTime;
		}
	}

	function handleLoadedMetadata() {
		if (videoElement) {
			duration = videoElement.duration;
		}
	}

	function togglePlay() {
		if (!videoElement) return;
		if (isPlaying) {
			videoElement.pause();
		} else {
			videoElement.play();
		}
		isPlaying = !isPlaying;
	}

	function handleTimelineClick(event) {
		if (!videoElement || !timelineRef) return;
		const rect = timelineRef.getBoundingClientRect();
		const clickX = event.clientX - rect.left;
		const percentage = clickX / rect.width;
		const newTime = percentage * duration;
		videoElement.currentTime = newTime;
		currentTime = newTime;
	}

	function formatTime(seconds) {
		if (!seconds || isNaN(seconds)) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}
</script>

<div class="flex flex-col h-full w-full">
	<VideoToolbar />
	<div class="flex-1 flex justify-center items-center p-8 overflow-auto">
		<div class="w-full max-w-[1200px]">
			<input 
				type="file" 
				accept="video/*" 
				on:change={handleVideoUpload}
				id="video-upload"
				class="hidden"
			/>
			{#if !$videoFile}
				<label for="video-upload" class="flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed border-[#4a4a4a] rounded-lg cursor-pointer transition-all duration-200 bg-[#2a2a2a] hover:border-[#4a90e2] hover:bg-[#333]">
					<span class="text-5xl">📹</span>
					<span>Click to upload a video</span>
				</label>
			{:else}
				<div class="w-full flex flex-col gap-4">
					<div class="w-full flex justify-center bg-black rounded overflow-hidden">
						<video 
							bind:this={videoElement}
							src={videoUrl}
							class="max-w-full max-h-[70vh] block"
							on:timeupdate={handleTimeUpdate}
							on:loadedmetadata={handleLoadedMetadata}
							on:play={() => isPlaying = true}
							on:pause={() => isPlaying = false}
							on:ended={() => isPlaying = false}
						>
							<track kind="captions" />
						</video>
					</div>
					<div class="flex items-center gap-4 p-4 bg-[#2a2a2a] rounded">
						<button class="w-12 h-12 rounded-full bg-[#4a90e2] border-none text-white text-2xl cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-[#5aa0f2]" on:click={togglePlay}>
							{isPlaying ? '⏸' : '▶'}
						</button>
						<div class="flex-1 flex items-center">
							<div 
								bind:this={timelineRef}
								role="slider"
								tabindex="0"
								aria-label="Video timeline"
								aria-valuemin="0"
								aria-valuemax={duration || 0}
								aria-valuenow={currentTime || 0}
								class="w-full h-2 bg-[#3a3a3a] rounded cursor-pointer relative overflow-hidden"
								on:click={handleTimelineClick}
								on:keydown={(e) => {
									if (!videoElement || !duration) return;
									const step = duration / 100;
									if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
										e.preventDefault();
										videoElement.currentTime = Math.max(0, currentTime - step);
									} else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
										e.preventDefault();
										videoElement.currentTime = Math.min(duration, currentTime + step);
									} else if (e.key === 'Home') {
										e.preventDefault();
										videoElement.currentTime = 0;
									} else if (e.key === 'End') {
										e.preventDefault();
										videoElement.currentTime = duration;
									}
								}}
							>
								<div 
									class="h-full bg-[#4a90e2] rounded transition-all duration-100"
									style="width: {duration ? (currentTime / duration * 100) : 0}%"
								></div>
							</div>
						</div>
						<div class="text-[#aaa] text-sm font-mono min-w-[100px] text-right">
							{formatTime(currentTime)} / {formatTime(duration)}
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

