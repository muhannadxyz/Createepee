<script>
	import { onMount } from 'svelte';
	import { canvasInstance, imageFile, activeTool } from '$lib/stores/editorStore.js';
	import ImageToolbar from './ImageToolbar.svelte';
	
	let canvasContainer;
	let fabricCanvas = null;
	let fabricLib = null;
	let isDrawing = false;
	let startX = 0;
	let startY = 0;
	let currentShape = null;
	let isFabricReady = false;
	let history = [];
	let historyIndex = -1;

	async function initFabric() {
		if (isFabricReady) return;
		
		const fabricModule = await import('fabric');
		fabricLib = fabricModule.fabric || fabricModule.default || fabricModule;
		
		if (!canvasContainer) return;
		
		fabricCanvas = new fabricLib.Canvas(canvasContainer, {
			width: 800,
			height: 600,
			backgroundColor: '#ffffff'
		});
		
		canvasInstance.set(fabricCanvas);
		isFabricReady = true;
		
		// Handle canvas clicks for tools
		fabricCanvas.on('mouse:down', handleMouseDown);
		fabricCanvas.on('mouse:move', handleMouseMove);
		fabricCanvas.on('mouse:up', handleMouseUp);
		
		// Save state for undo/redo
		fabricCanvas.on('path:created', saveState);
	}

	onMount(async () => {
		// Initialize fabric immediately
		await initFabric();
		
		// Listen for filter application events
		window.addEventListener('applyFilters', handleApplyFilters);
		window.addEventListener('undo', () => undo());
		window.addEventListener('redo', () => redo());
		
		// Keyboard shortcuts
		const handleKeyDown = (e) => {
			if (e.key === 'Delete' || e.key === 'Backspace') {
				if (fabricCanvas) {
					const activeObject = fabricCanvas.getActiveObject();
					if (activeObject) {
						fabricCanvas.remove(activeObject);
						fabricCanvas.renderAll();
					}
				}
			}
			if (e.ctrlKey || e.metaKey) {
				if (e.key === 'z' && !e.shiftKey) {
					e.preventDefault();
					undo();
				} else if (e.key === 'z' && e.shiftKey) {
					e.preventDefault();
					redo();
				} else if (e.key === 'y') {
					e.preventDefault();
					redo();
				}
			}
		};
		
		window.addEventListener('keydown', handleKeyDown);
		
		return () => {
			window.removeEventListener('applyFilters', handleApplyFilters);
			window.removeEventListener('keydown', handleKeyDown);
			if (fabricCanvas) {
				fabricCanvas.dispose();
			}
		};
	});

	function handleApplyFilters(event) {
		if (!fabricLib || !fabricCanvas) return;
		
		const { brightness, contrast, saturation, blur } = event.detail;
		const activeObject = fabricCanvas.getActiveObject();
		
		if (!activeObject) {
			// Apply to all objects
			fabricCanvas.getObjects().forEach((obj) => {
				applyFiltersToObject(obj, brightness, contrast, saturation, blur);
			});
		} else {
			applyFiltersToObject(activeObject, brightness, contrast, saturation, blur);
		}
		
		fabricCanvas.renderAll();
	}

	function applyFiltersToObject(obj, brightness, contrast, saturation, blur) {
		// Remove existing filters
		obj.filters = [];
		
		// Apply new filters
		if (brightness !== 0) {
			obj.filters.push(new fabricLib.filters.Brightness({ brightness: brightness / 100 }));
		}
		if (contrast !== 0) {
			obj.filters.push(new fabricLib.filters.Contrast({ contrast: contrast / 100 }));
		}
		if (saturation !== 0) {
			obj.filters.push(new fabricLib.filters.Saturation({ saturation: saturation / 100 }));
		}
		if (blur !== 0) {
			obj.filters.push(new fabricLib.filters.Blur({ blur: blur / 10 }));
		}
		
		obj.applyFilters();
	}

	function handleMouseDown(options) {
		if (!$activeTool || !fabricCanvas) return;
		
		const pointer = fabricCanvas.getPointer(options.e);
		startX = pointer.x;
		startY = pointer.y;
		isDrawing = true;

		if ($activeTool === 'select') {
			// Selection mode - handled by Fabric.js default
			return;
		} else if ($activeTool === 'text') {
			const text = new fabricLib.Textbox('Double click to edit', {
				left: startX,
				top: startY,
				fontSize: 20,
				fill: '#000000',
				width: 200
			});
			fabricCanvas.add(text);
			fabricCanvas.setActiveObject(text);
			fabricCanvas.renderAll();
			activeTool.set(null);
			saveState();
		} else if ($activeTool === 'rectangle') {
			currentShape = new fabricLib.Rect({
				left: startX,
				top: startY,
				width: 0,
				height: 0,
				fill: 'transparent',
				stroke: '#000000',
				strokeWidth: 2
			});
			fabricCanvas.add(currentShape);
		} else if ($activeTool === 'circle') {
			currentShape = new fabricLib.Circle({
				left: startX,
				top: startY,
				radius: 0,
				fill: 'transparent',
				stroke: '#000000',
				strokeWidth: 2
			});
			fabricCanvas.add(currentShape);
		} else if ($activeTool === 'ellipse') {
			currentShape = new fabricLib.Ellipse({
				left: startX,
				top: startY,
				rx: 0,
				ry: 0,
				fill: 'transparent',
				stroke: '#000000',
				strokeWidth: 2
			});
			fabricCanvas.add(currentShape);
		} else if ($activeTool === 'line') {
			currentShape = new fabricLib.Line([startX, startY, startX, startY], {
				stroke: '#000000',
				strokeWidth: 2
			});
			fabricCanvas.add(currentShape);
		} else if ($activeTool === 'freedraw') {
			fabricCanvas.isDrawingMode = true;
			fabricCanvas.freeDrawingBrush.width = 5;
			fabricCanvas.freeDrawingBrush.color = '#000000';
		}
	}

	function handleMouseMove(options) {
		if ($activeTool === 'freedraw') return;
		if (!isDrawing || !currentShape || !fabricCanvas) return;
		
		const pointer = fabricCanvas.getPointer(options.e);
		
		if ($activeTool === 'rectangle') {
			currentShape.set({
				width: Math.abs(pointer.x - startX),
				height: Math.abs(pointer.y - startY)
			});
			if (pointer.x < startX) currentShape.set({ left: pointer.x });
			if (pointer.y < startY) currentShape.set({ top: pointer.y });
		} else if ($activeTool === 'circle') {
			const radius = Math.sqrt(
				Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2)
			);
			currentShape.set({ radius });
		} else if ($activeTool === 'ellipse') {
			const rx = Math.abs(pointer.x - startX) / 2;
			const ry = Math.abs(pointer.y - startY) / 2;
			currentShape.set({
				rx: rx,
				ry: ry,
				left: pointer.x < startX ? pointer.x : startX,
				top: pointer.y < startY ? pointer.y : startY
			});
		} else if ($activeTool === 'line') {
			currentShape.set({
				x2: pointer.x,
				y2: pointer.y
			});
		}
		
		fabricCanvas.renderAll();
	}

	function handleMouseUp() {
		if ($activeTool === 'freedraw') {
			fabricCanvas.isDrawingMode = false;
			saveState();
			return;
		}
		
		isDrawing = false;
		if (currentShape) {
			saveState();
		}
		currentShape = null;
		if ($activeTool && $activeTool !== 'text' && $activeTool !== 'select') {
			activeTool.set(null);
		}
	}

	async function handleImageUpload(event) {
		const file = event.target.files[0];
		if (!file) return;
		
		if (!file.type.startsWith('image/')) {
			alert('Please upload an image file');
			return;
		}
		
		imageFile.set(file);
		
		// Make sure fabric is initialized
		if (!isFabricReady) {
			await initFabric();
		}
		
		if (!fabricLib || !fabricCanvas) {
			// Wait a bit and try again
			setTimeout(() => handleImageUpload(event), 100);
			return;
		}
		
		const reader = new FileReader();
		reader.onload = (e) => {
			const imageUrl = e.target.result;
			fabricLib.Image.fromURL(imageUrl, (img) => {
				if (!fabricCanvas) return;
				
				fabricCanvas.clear();
				
				// Calculate scale to fit canvas while maintaining aspect ratio
				const canvasWidth = fabricCanvas.width;
				const canvasHeight = fabricCanvas.height;
				const imgWidth = img.width;
				const imgHeight = img.height;
				
				const scale = Math.min(
					canvasWidth / imgWidth,
					canvasHeight / imgHeight,
					1 // Don't scale up
				);
				
				img.scale(scale);
				
				// Center the image
				const scaledWidth = imgWidth * scale;
				const scaledHeight = imgHeight * scale;
				
				img.set({
					left: (canvasWidth - scaledWidth) / 2,
					top: (canvasHeight - scaledHeight) / 2,
					selectable: true,
					hasControls: true
				});
				
				fabricCanvas.add(img);
				fabricCanvas.setActiveObject(img);
				fabricCanvas.renderAll();
				saveState();
			}, {
				crossOrigin: 'anonymous'
			});
		};
		reader.readAsDataURL(file);
	}

	function saveState() {
		if (!fabricCanvas) return;
		const json = JSON.stringify(fabricCanvas.toJSON());
		history = history.slice(0, historyIndex + 1);
		history.push(json);
		historyIndex = history.length - 1;
		if (history.length > 50) {
			history.shift();
			historyIndex--;
		}
	}

	function undo() {
		if (historyIndex > 0) {
			historyIndex--;
			fabricCanvas.loadFromJSON(history[historyIndex], () => {
				fabricCanvas.renderAll();
			});
		}
	}

	function redo() {
		if (historyIndex < history.length - 1) {
			historyIndex++;
			fabricCanvas.loadFromJSON(history[historyIndex], () => {
				fabricCanvas.renderAll();
			});
		}
	}
</script>

<div class="flex flex-col h-full w-full">
	<ImageToolbar />
	<div class="flex-1 flex justify-center items-center p-8 md:p-4 overflow-auto">
		<input 
			type="file" 
			accept="image/*" 
			on:change={handleImageUpload}
			id="image-upload"
			class="hidden"
		/>
		{#if !$imageFile}
			<label for="image-upload" class="flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed border-[#4a4a4a] rounded-lg cursor-pointer transition-all duration-200 bg-[#2a2a2a] hover:border-[#4a90e2] hover:bg-[#333]">
				<span class="text-5xl">📁</span>
				<span>Click to upload an image</span>
			</label>
		{/if}
		<div class="flex justify-center items-center w-full h-full overflow-auto">
			<canvas bind:this={canvasContainer} class="border border-[#3a3a3a] rounded shadow-lg bg-white max-w-full max-h-full"></canvas>
		</div>
	</div>
</div>

