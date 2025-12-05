<script>
	import { showExportModal, editorMode, canvasInstance, processedVideoPath } from '$lib/stores/editorStore.js';
	import * as videoUtils from '$lib/utils/videoUtils.js';
	
	let imageFormat = 'png';
	let videoQuality = 'high';
	let exporting = false;
	
	function closeModal() {
		showExportModal.set(false);
	}
	
	function exportImage() {
		if (!$canvasInstance) return;
		
		const dataURL = $canvasInstance.toDataURL({
			format: imageFormat,
			quality: imageFormat === 'jpg' ? 0.9 : 1.0
		});
		
		const link = document.createElement('a');
		link.download = `image.${imageFormat}`;
		link.href = dataURL;
		link.click();
		
		closeModal();
	}

	function exportVideo() {
		if (!$processedVideoPath) {
			alert('No processed video to export. Please apply edits first.');
			return;
		}
		
		exporting = true;
		try {
			videoUtils.downloadVideo($processedVideoPath);
			closeModal();
		} catch (err) {
			alert('Failed to export video: ' + err.message);
		} finally {
			exporting = false;
		}
	}
</script>

{#if $showExportModal}
	<div class="fixed inset-0 bg-black/70 flex justify-center items-center z-[10000]" on:click={closeModal} on:keydown={(e) => e.key === 'Escape' && closeModal()}>
		<div class="bg-[#2a2a2a] rounded-lg p-0 min-w-[400px] max-w-[90vw] border border-[#3a3a3a]" on:click|stopPropagation>
			<div class="flex justify-between items-center p-6 border-b border-[#3a3a3a]">
				<h2 class="m-0 text-2xl">Export {$editorMode === 'image' ? 'Image' : 'Video'}</h2>
				<button class="bg-transparent border-none text-white text-4xl cursor-pointer leading-none p-0 w-8 h-8 flex items-center justify-center hover:text-[#ff4444]" on:click={closeModal}>×</button>
			</div>
			
			<div class="p-6">
				{#if $editorMode === 'image'}
					<div class="mb-6">
						<label class="flex justify-between items-center mb-4 font-medium">
							Format:
							<select bind:value={imageFormat} class="p-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-base">
								<option value="png">PNG</option>
								<option value="jpg">JPG</option>
							</select>
						</label>
					</div>
					<button class="w-full p-4 bg-[#4a90e2] border-none rounded-md text-white font-semibold text-base cursor-pointer transition-all duration-200 hover:bg-[#5aa0f2]" on:click={exportImage}>
						Download Image
					</button>
				{:else}
					<div class="mb-6">
						<label class="flex justify-between items-center mb-4 font-medium">
							Quality:
							<select bind:value={videoQuality} class="p-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white text-base">
								<option value="high">High</option>
								<option value="medium">Medium</option>
								<option value="low">Low</option>
							</select>
						</label>
					</div>
					<button 
						class="w-full p-4 bg-[#4a90e2] border-none rounded-md text-white font-semibold text-base cursor-pointer transition-all duration-200 hover:bg-[#5aa0f2] disabled:opacity-50 disabled:cursor-not-allowed" 
						on:click={exportVideo}
						disabled={!$processedVideoPath || exporting}
					>
						{exporting ? 'Exporting...' : 'Export Video'}
					</button>
					{#if !$processedVideoPath}
						<p class="mt-2 text-sm text-[#aaa] text-center">Apply edits to video first before exporting</p>
					{/if}
				{/if}
			</div>
		</div>
	</div>
{/if}

