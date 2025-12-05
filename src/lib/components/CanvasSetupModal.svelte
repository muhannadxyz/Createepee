<script>
	import { showCanvasSetup, canvasWidth, canvasHeight, canvasBackgroundColor, canvasInitialized } from '$lib/stores/editorStore.js';
	
	// Only show modal if canvas is not initialized
	$: shouldShow = $showCanvasSetup && !$canvasInitialized;
	
	/**
	 * CanvasSetupModal Component
	 * 
	 * Modal dialog for setting up the canvas before starting to edit.
	 * Allows users to:
	 * - Choose canvas size from presets or custom
	 * - Upload an existing image
	 * - Start with a blank canvas
	 * - Set background color for blank canvas
	 */
	
	// Canvas size presets
	const sizePresets = [
		{ name: '1920x1080 (Full HD)', width: 1920, height: 1080 },
		{ name: '1080x1080 (Square)', width: 1080, height: 1080 },
		{ name: '800x600 (Standard)', width: 800, height: 600 },
		{ name: '1920x1080 (Landscape)', width: 1920, height: 1080 },
		{ name: '1080x1920 (Portrait)', width: 1080, height: 1920 },
		{ name: 'Custom', width: null, height: null }
	];
	
	// Local state
	let selectedPreset = sizePresets[2]; // Default to 800x600
	let customWidth = 800;
	let customHeight = 600;
	let canvasType = 'blank'; // 'blank' or 'upload'
	let backgroundColor = '#ffffff';
	let fileInput;
	
	/**
	 * Handle preset selection
	 */
	function selectPreset(preset) {
		selectedPreset = preset;
		if (preset.width !== null) {
			customWidth = preset.width;
			customHeight = preset.height;
		}
	}
	
	/**
	 * Create blank canvas
	 */
	function createBlankCanvas() {
		const width = selectedPreset.width !== null ? selectedPreset.width : customWidth;
		const height = selectedPreset.height !== null ? selectedPreset.height : customHeight;
		
		canvasWidth.set(width);
		canvasHeight.set(height);
		canvasBackgroundColor.set(backgroundColor);
		showCanvasSetup.set(false);
		// Trigger canvas initialization
		canvasInitialized.set(true);
	}
	
	/**
	 * Handle image upload
	 */
	async function handleImageUpload(event) {
		const file = event.target.files[0];
		if (!file) return;
		
		if (!file.type.startsWith('image/')) {
			alert('Please upload an image file');
			return;
		}
		
		// Set canvas type to upload and close modal
		// The ImageEditor will handle the actual upload
		canvasType = 'upload';
		showCanvasSetup.set(false);
		
		// Set canvas size based on image (will be adjusted in ImageEditor)
		// For now, use a default size that will be updated
		canvasWidth.set(1920);
		canvasHeight.set(1080);
		canvasBackgroundColor.set('#ffffff');
		
		// Trigger canvas initialization
		canvasInitialized.set(true);
		
		// Wait a moment for canvas to initialize, then trigger upload
		setTimeout(() => {
			const uploadEvent = new CustomEvent('canvasImageUpload', {
				detail: { file }
			});
			window.dispatchEvent(uploadEvent);
		}, 200);
	}
	
	/**
	 * Close modal
	 */
	function closeModal() {
		showCanvasSetup.set(false);
	}
	
	/**
	 * Handle keyboard shortcuts
	 */
	function handleKeyDown(e) {
		if (e.key === 'Escape') {
			closeModal();
		} else if (e.key === 'Enter' && canvasType === 'blank') {
			createBlankCanvas();
		}
	}
</script>

<svelte:window on:keydown={handleKeyDown} />

{#if shouldShow}
	<div 
		class="fixed inset-0 bg-black/70 flex justify-center items-center z-[10000]" 
		on:click={closeModal}
		role="dialog"
		aria-modal="true"
		aria-labelledby="canvas-setup-title"
	>
		<div 
			class="bg-[#2a2a2a] rounded-lg p-6 min-w-[500px] max-w-[90vw] border border-[#3a3a3a]"
			on:click|stopPropagation
		>
			<!-- Header -->
			<div class="flex justify-between items-center mb-6">
				<h2 id="canvas-setup-title" class="m-0 text-2xl text-white font-semibold">Canvas Setup</h2>
				<button 
					class="bg-transparent border-none text-white text-4xl cursor-pointer leading-none p-0 w-8 h-8 flex items-center justify-center hover:text-[#ff4444] transition-colors"
					on:click={closeModal}
					aria-label="Close"
				>
					×
				</button>
			</div>
			
			<!-- Canvas Type Selection -->
			<div class="mb-6">
				<label class="block text-sm font-semibold text-[#aaa] mb-3 uppercase">Start With</label>
				<div class="flex gap-4">
					<button
						class="flex-1 px-4 py-3 bg-[#3a3a3a] border-2 rounded-md text-white cursor-pointer transition-all duration-200 {canvasType === 'blank' ? 'border-[#4a90e2] bg-[#4a4a4a]' : 'border-[#4a4a4a] hover:border-[#5a5a5a]'}"
						on:click={() => canvasType = 'blank'}
					>
						Blank Canvas
					</button>
					<button
						class="flex-1 px-4 py-3 bg-[#3a3a3a] border-2 rounded-md text-white cursor-pointer transition-all duration-200 {canvasType === 'upload' ? 'border-[#4a90e2] bg-[#4a4a4a]' : 'border-[#4a4a4a] hover:border-[#5a5a5a]'}"
						on:click={() => canvasType = 'upload'}
					>
						Upload Image
					</button>
				</div>
			</div>
			
			{#if canvasType === 'blank'}
				<!-- Canvas Size Selection -->
				<div class="mb-6">
					<label class="block text-sm font-semibold text-[#aaa] mb-3 uppercase">Canvas Size</label>
					<div class="grid grid-cols-2 gap-2 mb-4">
						{#each sizePresets as preset}
							<button
								class="px-4 py-2 bg-[#3a3a3a] border-2 rounded-md text-white text-sm cursor-pointer transition-all duration-200 {selectedPreset === preset ? 'border-[#4a90e2] bg-[#4a4a4a]' : 'border-[#4a4a4a] hover:border-[#5a5a5a]'}"
								on:click={() => selectPreset(preset)}
							>
								{preset.name}
							</button>
						{/each}
					</div>
					
					{#if selectedPreset.width === null}
						<!-- Custom Size Inputs -->
						<div class="flex gap-4">
							<div class="flex-1">
								<label for="custom-width" class="block text-sm text-[#aaa] mb-2">Width (px)</label>
								<input
									id="custom-width"
									type="number"
									min="1"
									max="10000"
									bind:value={customWidth}
									class="w-full px-3 py-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white"
								/>
							</div>
							<div class="flex-1">
								<label for="custom-height" class="block text-sm text-[#aaa] mb-2">Height (px)</label>
								<input
									id="custom-height"
									type="number"
									min="1"
									max="10000"
									bind:value={customHeight}
									class="w-full px-3 py-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white"
								/>
							</div>
						</div>
					{:else}
						<!-- Display selected preset size -->
						<div class="text-sm text-[#aaa]">
							Size: {selectedPreset.width} × {selectedPreset.height}px
						</div>
					{/if}
				</div>
				
				<!-- Background Color (for blank canvas) -->
				<div class="mb-6">
					<label for="bg-color" class="block text-sm font-semibold text-[#aaa] mb-3 uppercase">Background Color</label>
					<div class="flex items-center gap-4">
						<input
							id="bg-color"
							type="color"
							bind:value={backgroundColor}
							class="w-20 h-10 border border-[#4a4a4a] rounded cursor-pointer"
						/>
						<span class="text-sm text-[#aaa]">{backgroundColor}</span>
					</div>
				</div>
				
				<!-- Create Button -->
				<button
					class="w-full px-6 py-3 bg-[#4a90e2] border-none rounded-md text-white font-semibold cursor-pointer transition-all duration-200 hover:bg-[#5aa0f2]"
					on:click={createBlankCanvas}
				>
					Create Canvas
				</button>
			{:else}
				<!-- Upload Image -->
				<div class="mb-6">
					<label class="block text-sm font-semibold text-[#aaa] mb-3 uppercase">Upload Image</label>
					<input
						type="file"
						accept="image/*"
						bind:this={fileInput}
						on:change={handleImageUpload}
						class="hidden"
						id="canvas-image-upload"
					/>
					<label
						for="canvas-image-upload"
						class="flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed border-[#4a4a4a] rounded-lg cursor-pointer transition-all duration-200 bg-[#3a3a3a] hover:border-[#4a90e2] hover:bg-[#4a4a4a]"
					>
						<span class="text-5xl">📁</span>
						<span class="text-white">Click to select an image</span>
						<span class="text-sm text-[#aaa]">PNG, JPG, GIF, WebP supported</span>
					</label>
				</div>
			{/if}
		</div>
	</div>
{/if}

