<script>
	import { onMount } from 'svelte';
	import { 
		canvasInstance, 
		imageFile, 
		activeTool,
		brushSize,
		brushOpacity,
		brushFlow,
		brushColor,
		gradientStartColor,
		gradientEndColor,
		gradientType,
		gradientAngle,
		showCanvasSetup,
		canvasWidth,
		canvasHeight,
		canvasBackgroundColor,
		canvasInitialized,
		fillColor,
		strokeColor,
		strokeWidth
	} from '$lib/stores/editorStore.js';
	import ImageToolbar from './ImageToolbar.svelte';
	import LayersPanel from './LayersPanel.svelte';
	import PropertiesPanel from './PropertiesPanel.svelte';
	import StatusBar from './StatusBar.svelte';
	import ToolOptionsBar from './ToolOptionsBar.svelte';
	import CanvasSetupModal from './CanvasSetupModal.svelte';
	
	/**
	 * ImageEditor Component
	 * 
	 * Main image editor component with professional Photoshop/Affinity-like features:
	 * - Professional panel layout (left toolbar, right panels, top options bar, bottom status bar)
	 * - Enhanced drawing tools (brush with opacity/flow, shapes, text)
	 * - Selection tools (select, lasso, magic wand)
	 * - Transform tools (rotate, scale, skew)
	 * - Gradient tool
	 * - Layer management with visibility, lock, opacity
	 * - Undo/redo history
	 * - Image filters
	 */
	
	// Canvas references
	let canvasContainer;
	let fabricCanvas = null;
	let fabricLib = null;
	let isFabricReady = false;
	
	// Drawing state
	let isDrawing = false;
	let startX = 0;
	let startY = 0;
	let currentShape = null;
	
	// Selection tools state
	let lassoPoints = [];
	let isLassoActive = false;
	let magicWandTolerance = 30;
	
	// Copy/paste state
	let copiedObject = null;
	
	// History management
	let history = [];
	let historyIndex = -1;
	
	// Constrain proportions state
	let isShiftPressed = false;
	
	/**
	 * Initialize Fabric.js canvas
	 * Sets up the canvas with proper configuration and event handlers
	 */
	async function initFabric() {
		if (isFabricReady) return;
		
		// Dynamically import Fabric.js library
		const fabricModule = await import('fabric');
		fabricLib = fabricModule.fabric || fabricModule.default || fabricModule;
		
		if (!canvasContainer) return;
		
		// Create new Fabric.js canvas instance
		// Use canvas size from store (set by CanvasSetupModal)
		const width = $canvasWidth || 800;
		const height = $canvasHeight || 600;
		const bgColor = $canvasBackgroundColor || '#ffffff';
		
		fabricCanvas = new fabricLib.Canvas(canvasContainer, {
			width: width,
			height: height,
			backgroundColor: bgColor,
			preserveObjectStacking: true, // Important for proper layer ordering
			renderOnAddRemove: true // Ensure objects render when added
		});
		
		// Enable transform controls for all objects
		fabricCanvas.selection = true;
		fabricCanvas.selectionColor = 'rgba(74, 144, 226, 0.3)';
		fabricCanvas.selectionBorderColor = '#4a90e2';
		fabricCanvas.selectionLineWidth = 2;
		
		canvasInstance.set(fabricCanvas);
		isFabricReady = true;
		canvasInitialized.set(true);
		
		// Set up canvas event handlers
		fabricCanvas.on('mouse:down', handleMouseDown);
		fabricCanvas.on('mouse:move', handleMouseMove);
		fabricCanvas.on('mouse:up', handleMouseUp);
		fabricCanvas.on('object:added', saveState);
		fabricCanvas.on('object:modified', saveState);
		fabricCanvas.on('path:created', saveState);
		fabricCanvas.on('object:dblclick', handleDoubleClick);
		
		// Enable multi-select with Shift key
		fabricCanvas.on('selection:created', (e) => {
			// Handle multi-select
			if (e.e && (e.e.shiftKey || e.e.ctrlKey || e.e.metaKey)) {
				const activeObject = fabricCanvas.getActiveObject();
				const activeSelection = fabricCanvas.getActiveObjects();
				if (activeSelection.length > 1) {
					// Create a group for multi-select
					const group = new fabricLib.ActiveSelection(activeSelection, {
						canvas: fabricCanvas
					});
					fabricCanvas.setActiveObject(group);
					fabricCanvas.renderAll();
				}
			}
		});
		
		// Listen for object selection changes to update properties panel
		fabricCanvas.on('selection:created', () => {
			// Trigger reactivity update
			canvasInstance.set(fabricCanvas);
		});
		fabricCanvas.on('selection:updated', () => {
			canvasInstance.set(fabricCanvas);
		});
		fabricCanvas.on('selection:cleared', () => {
			canvasInstance.set(fabricCanvas);
		});
		
		// Save initial state
		saveState();
	}
	
	/**
	 * Handle mouse down events for various tools
	 * @param {Object} options - Fabric.js mouse event options
	 */
	function handleMouseDown(options) {
		if (!$activeTool || !fabricCanvas) return;
		
		const pointer = fabricCanvas.getPointer(options.e);
		startX = pointer.x;
		startY = pointer.y;
		isDrawing = true;
		
		// Handle different tools
		switch ($activeTool) {
			case 'select':
				// Selection is handled by Fabric.js default behavior
				return;
				
			case 'lasso':
				// Start lasso selection
				isLassoActive = true;
				lassoPoints = [{ x: startX, y: startY }];
				break;
				
			case 'magicwand':
				// Magic wand selection (color-based)
				handleMagicWand(pointer);
				break;
				
			case 'text':
				// Create text object
				createTextObject(startX, startY);
				isDrawing = false; // Text is created immediately, not drawn
				break;
				
			case 'rectangle':
				// Start drawing rectangle
				currentShape = new fabricLib.Rect({
					left: startX,
					top: startY,
					width: 0,
					height: 0,
					fill: $fillColor || '#ffffff',
					stroke: $strokeColor || '#000000',
					strokeWidth: $strokeWidth || 2,
					selectable: true,
					hasControls: true
				});
				fabricCanvas.add(currentShape);
				break;
				
			case 'circle':
				// Start drawing circle
				currentShape = new fabricLib.Circle({
					left: startX,
					top: startY,
					radius: 0,
					fill: $fillColor || '#ffffff',
					stroke: $strokeColor || '#000000',
					strokeWidth: $strokeWidth || 2,
					selectable: true,
					hasControls: true
				});
				fabricCanvas.add(currentShape);
				break;
				
			case 'ellipse':
				// Start drawing ellipse
				currentShape = new fabricLib.Ellipse({
					left: startX,
					top: startY,
					rx: 0,
					ry: 0,
					fill: $fillColor || '#ffffff',
					stroke: $strokeColor || '#000000',
					strokeWidth: $strokeWidth || 2,
					selectable: true,
					hasControls: true
				});
				fabricCanvas.add(currentShape);
				break;
				
			case 'line':
				// Start drawing line
				currentShape = new fabricLib.Line([startX, startY, startX, startY], {
					stroke: $strokeColor || '#000000',
					strokeWidth: $strokeWidth || 2,
					selectable: true,
					hasControls: true
				});
				fabricCanvas.add(currentShape);
				break;
				
			case 'freedraw':
				// Enable free drawing mode
				fabricCanvas.isDrawingMode = true;
				if (fabricCanvas.freeDrawingBrush) {
					fabricCanvas.freeDrawingBrush.width = $brushSize;
					fabricCanvas.freeDrawingBrush.color = $brushColor;
					fabricCanvas.freeDrawingBrush.opacity = $brushOpacity / 100;
				}
				break;
				
			case 'gradient':
				// Start gradient creation - will complete on mouse up
				isDrawing = true;
				break;
		}
	}
	
	/**
	 * Handle mouse move events for drawing shapes and lasso
	 * @param {Object} options - Fabric.js mouse event options
	 */
	function handleMouseMove(options) {
		if (!$activeTool || !fabricCanvas) return;
		
		const pointer = fabricCanvas.getPointer(options.e);
		
		// Handle lasso tool
		if ($activeTool === 'lasso' && isLassoActive) {
			lassoPoints.push({ x: pointer.x, y: pointer.y });
			// Draw temporary lasso path (visual feedback)
			drawLassoPreview();
			return;
		}
		
		// Handle free drawing (managed by Fabric.js)
		if ($activeTool === 'freedraw') return;
		
		// Handle gradient tool preview
		if ($activeTool === 'gradient' && isDrawing) {
			// Show preview of gradient area (optional visual feedback)
			return;
		}
		
		// Handle shape drawing
		if (!isDrawing || !currentShape) return;
		
		switch ($activeTool) {
			case 'rectangle':
				// Update rectangle dimensions
				let rectWidth = Math.abs(pointer.x - startX);
				let rectHeight = Math.abs(pointer.y - startY);
				
				// If Shift is pressed, make it a square
				if (isShiftPressed) {
					const size = Math.max(rectWidth, rectHeight);
					rectWidth = size;
					rectHeight = size;
				}
				
				currentShape.set({
					width: rectWidth,
					height: rectHeight
				});
				if (pointer.x < startX) currentShape.set({ left: pointer.x });
				if (pointer.y < startY) currentShape.set({ top: pointer.y });
				break;
				
			case 'circle':
				// Update circle radius
				// If Shift is pressed, it's already a circle (no change needed)
				const radius = Math.sqrt(
					Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2)
				);
				currentShape.set({ radius });
				break;
				
			case 'ellipse':
				// Update ellipse dimensions
				let rx = Math.abs(pointer.x - startX) / 2;
				let ry = Math.abs(pointer.y - startY) / 2;
				
				// If Shift is pressed, make it a circle
				if (isShiftPressed) {
					const radius = Math.max(rx, ry);
					rx = radius;
					ry = radius;
				}
				
				currentShape.set({
					rx: rx,
					ry: ry,
					left: pointer.x < startX ? pointer.x : startX,
					top: pointer.y < startY ? pointer.y : startY
				});
				break;
				
			case 'line':
				// Update line end point
				currentShape.set({
					x2: pointer.x,
					y2: pointer.y
				});
				break;
		}
		
		fabricCanvas.renderAll();
	}
	
	/**
	 * Handle mouse up events
	 * Finalizes shape drawing and lasso selection
	 */
	function handleMouseUp(options) {
		if (!$activeTool || !fabricCanvas) return;
		
		// Handle lasso tool completion
		if ($activeTool === 'lasso' && isLassoActive && lassoPoints.length > 2) {
			completeLassoSelection();
			isLassoActive = false;
			lassoPoints = [];
			return;
		}
		
		// Handle free drawing
		if ($activeTool === 'freedraw') {
			fabricCanvas.isDrawingMode = false;
			saveState();
			return;
		}
		
		// Handle gradient tool
		if ($activeTool === 'gradient' && isDrawing) {
			const pointer = fabricCanvas.getPointer(options.e);
			applyGradientToArea(startX, startY, pointer.x, pointer.y);
			isDrawing = false;
			saveState();
			return;
		}
		
		// Finalize shape drawing
		isDrawing = false;
		if (currentShape) {
			saveState();
		}
		currentShape = null;
		
		// Reset tool after creating shape (except for select tool)
		if ($activeTool && $activeTool !== 'select' && $activeTool !== 'text') {
			activeTool.set(null);
		}
	}
	
	/**
	 * Create a text object at the specified position
	 * @param {number} x - X coordinate
	 * @param {number} y - Y coordinate
	 */
	function createTextObject(x, y) {
		if (!fabricLib || !fabricCanvas) return;
		
		const text = new fabricLib.Textbox('Double click to edit', {
			left: x,
			top: y,
			fontSize: 20,
			fill: $strokeColor || '#000000', // Use stroke color for text (typically black)
			width: 200,
			selectable: true,
			hasControls: true,
			fontFamily: 'Arial'
		});
		
		fabricCanvas.add(text);
		fabricCanvas.setActiveObject(text);
		fabricCanvas.renderAll();
		activeTool.set(null);
		saveState();
	}
	
	/**
	 * Handle magic wand selection based on color similarity
	 * @param {Object} pointer - Mouse pointer coordinates
	 */
	function handleMagicWand(pointer) {
		if (!fabricCanvas) return;
		
		// Get pixel data at click point
		const ctx = fabricCanvas.getContext();
		const imageData = ctx.getImageData(
			Math.floor(pointer.x),
			Math.floor(pointer.y),
			1,
			1
		);
		
		if (!imageData.data) return;
		
		const targetR = imageData.data[0];
		const targetG = imageData.data[1];
		const targetB = imageData.data[2];
		
		// Get full canvas image data
		const fullImageData = ctx.getImageData(0, 0, fabricCanvas.width, fabricCanvas.height);
		const selectedPixels = [];
		
		// Find similar colored pixels
		for (let i = 0; i < fullImageData.data.length; i += 4) {
			const r = fullImageData.data[i];
			const g = fullImageData.data[i + 1];
			const b = fullImageData.data[i + 2];
			
			// Calculate color distance
			const distance = Math.sqrt(
				Math.pow(r - targetR, 2) +
				Math.pow(g - targetG, 2) +
				Math.pow(b - targetB, 2)
			);
			
			if (distance <= magicWandTolerance) {
				const x = (i / 4) % fabricCanvas.width;
				const y = Math.floor((i / 4) / fabricCanvas.width);
				selectedPixels.push({ x, y });
			}
		}
		
		// Create selection path from pixels (simplified - create bounding box for now)
		if (selectedPixels.length > 0) {
			const minX = Math.min(...selectedPixels.map(p => p.x));
			const maxX = Math.max(...selectedPixels.map(p => p.x));
			const minY = Math.min(...selectedPixels.map(p => p.y));
			const maxY = Math.max(...selectedPixels.map(p => p.y));
			
			// Create rectangle selection (simplified version)
			const selection = new fabricLib.Rect({
				left: minX,
				top: minY,
				width: maxX - minX,
				height: maxY - minY,
				fill: 'rgba(74, 144, 226, 0.3)',
				stroke: '#4a90e2',
				strokeWidth: 2,
				selectable: false,
				evented: false
			});
			
			fabricCanvas.add(selection);
			fabricCanvas.renderAll();
		}
	}
	
	/**
	 * Draw temporary lasso preview path
	 */
	function drawLassoPreview() {
		if (!fabricCanvas || lassoPoints.length < 2) return;
		
		// Remove previous preview if exists
		const existingPreview = fabricCanvas.getObjects().find(obj => obj.name === 'lassoPreview');
		if (existingPreview) {
			fabricCanvas.remove(existingPreview);
		}
		
		// Create path from points
		const pathData = lassoPoints.map((p, i) => 
			`${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
		).join(' ') + ' Z';
		
		const path = new fabricLib.Path(pathData, {
			fill: 'rgba(74, 144, 226, 0.2)',
			stroke: '#4a90e2',
			strokeWidth: 2,
			selectable: false,
			evented: false,
			name: 'lassoPreview'
		});
		
		fabricCanvas.add(path);
		fabricCanvas.renderAll();
	}
	
	/**
	 * Complete lasso selection and create selection path
	 */
	function completeLassoSelection() {
		if (!fabricCanvas || lassoPoints.length < 3) return;
		
		// Remove preview
		const preview = fabricCanvas.getObjects().find(obj => obj.name === 'lassoPreview');
		if (preview) {
			fabricCanvas.remove(preview);
		}
		
		// Create final selection path
		const pathData = lassoPoints.map((p, i) => 
			`${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
		).join(' ') + ' Z';
		
		const path = new fabricLib.Path(pathData, {
			fill: 'rgba(74, 144, 226, 0.3)',
			stroke: '#4a90e2',
			strokeWidth: 2,
			selectable: true,
			hasControls: true
		});
		
		fabricCanvas.add(path);
		fabricCanvas.setActiveObject(path);
		fabricCanvas.renderAll();
		saveState();
	}
	
	/**
	 * Apply gradient to selected object or create gradient rectangle
	 * @param {number} x1 - Start X coordinate
	 * @param {number} y1 - Start Y coordinate
	 * @param {number} x2 - End X coordinate
	 * @param {number} y2 - End Y coordinate
	 */
	function applyGradientToArea(x1, y1, x2, y2) {
		if (!fabricLib || !fabricCanvas) return;
		
		const activeObject = fabricCanvas.getActiveObject();
		
		// If an object is selected, apply gradient to it
		if (activeObject && (activeObject.type === 'rect' || activeObject.type === 'circle' || activeObject.type === 'ellipse')) {
			const gradient = $gradientType === 'linear'
				? new fabricLib.Gradient({
					type: 'linear',
					coords: {
						x1: 0,
						y1: 0,
						x2: activeObject.width || 100,
						y2: 0
					},
					colorStops: [
						{ offset: 0, color: $gradientStartColor },
						{ offset: 1, color: $gradientEndColor }
					]
				})
				: new fabricLib.Gradient({
					type: 'radial',
					coords: {
						x1: (activeObject.width || 100) / 2,
						y1: (activeObject.height || 100) / 2,
						r1: 0,
						x2: (activeObject.width || 100) / 2,
						y2: (activeObject.height || 100) / 2,
						r2: Math.max(activeObject.width || 100, activeObject.height || 100) / 2
					},
					colorStops: [
						{ offset: 0, color: $gradientStartColor },
						{ offset: 1, color: $gradientEndColor }
					]
				});
			
			activeObject.set('fill', gradient);
			fabricCanvas.renderAll();
			saveState();
		} else {
			// Create a new gradient rectangle
			const width = Math.abs(x2 - x1);
			const height = Math.abs(y2 - y1);
			
			if (width > 0 && height > 0) {
				const gradient = $gradientType === 'linear'
					? new fabricLib.Gradient({
						type: 'linear',
						coords: {
							x1: 0,
							y1: 0,
							x2: width,
							y2: 0
						},
						colorStops: [
							{ offset: 0, color: $gradientStartColor },
							{ offset: 1, color: $gradientEndColor }
						]
					})
					: new fabricLib.Gradient({
						type: 'radial',
						coords: {
							x1: width / 2,
							y1: height / 2,
							r1: 0,
							x2: width / 2,
							y2: height / 2,
							r2: Math.max(width, height) / 2
						},
						colorStops: [
							{ offset: 0, color: $gradientStartColor },
							{ offset: 1, color: $gradientEndColor }
						]
					});
				
				const rect = new fabricLib.Rect({
					left: Math.min(x1, x2),
					top: Math.min(y1, y2),
					width: width,
					height: height,
					fill: gradient,
					stroke: 'transparent',
					selectable: true,
					hasControls: true
				});
				
				fabricCanvas.add(rect);
				fabricCanvas.setActiveObject(rect);
				fabricCanvas.renderAll();
				saveState();
			}
		}
	}
	
	/**
	 * Handle filter application events
	 * @param {Event} event - Custom filter event
	 */
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
	
	/**
	 * Apply filters to a specific object
	 * @param {Object} obj - Fabric.js object
	 * @param {number} brightness - Brightness value (-100 to 100)
	 * @param {number} contrast - Contrast value (-100 to 100)
	 * @param {number} saturation - Saturation value (-100 to 100)
	 * @param {number} blur - Blur value (0 to 50)
	 */
	function applyFiltersToObject(obj, brightness, contrast, saturation, blur) {
		if (!fabricLib) return;
		
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
	
	/**
	 * Handle image upload
	 * @param {Event} event - File input change event
	 */
	async function handleImageUpload(event) {
		const file = event.target?.files?.[0] || event.detail?.file;
		if (!file) return;
		
		if (!file.type.startsWith('image/')) {
			alert('Please upload an image file');
			return;
		}
		
		imageFile.set(file);
		
		// Ensure fabric is initialized
		if (!isFabricReady) {
			await initFabric();
		}
		
		// Wait for canvas to be ready with retries
		let retries = 0;
		while ((!fabricLib || !fabricCanvas) && retries < 10) {
			await new Promise(resolve => setTimeout(resolve, 100));
			retries++;
		}
		
		if (!fabricLib || !fabricCanvas) {
			console.error('Canvas not ready after retries');
			alert('Canvas is not ready. Please try again.');
			return;
		}
		
		const reader = new FileReader();
		reader.onload = (e) => {
			const imageUrl = e.target.result;
			
			// Use fromURL with proper error handling
			fabricLib.Image.fromURL(imageUrl, (img) => {
				if (!fabricCanvas || !img) {
					console.error('Failed to load image or canvas not available');
					alert('Failed to load image. Please try again.');
					return;
				}
				
				// Clear existing objects and history
				fabricCanvas.clear();
				history = [];
				historyIndex = -1;
				
				// Get image natural dimensions - wait for image to load
				const imgElement = img.getElement ? img.getElement() : null;
				let imgWidth = imgElement ? (imgElement.naturalWidth || imgElement.width || img.width || 100) : (img.width || 100);
				let imgHeight = imgElement ? (imgElement.naturalHeight || imgElement.height || img.height || 100) : (img.height || 100);
				
				// If image dimensions are not available yet, wait for image to load
				if (imgElement && (!imgWidth || !imgHeight || imgWidth === 0 || imgHeight === 0)) {
					imgElement.onload = () => {
						imgWidth = imgElement.naturalWidth || imgElement.width || 100;
						imgHeight = imgElement.naturalHeight || imgElement.height || 100;
						processImage(img, imgWidth, imgHeight);
					};
					// If already loaded, process immediately
					if (imgElement.complete) {
						imgWidth = imgElement.naturalWidth || imgElement.width || 100;
						imgHeight = imgElement.naturalHeight || imgElement.height || 100;
					}
				}
				
				processImage(img, imgWidth, imgHeight);
			}, {
				crossOrigin: 'anonymous'
			});
		};
		reader.readAsDataURL(file);
	}
	
	/**
	 * Process and add image to canvas
	 * @param {Object} img - Fabric.js image object
	 * @param {number} imgWidth - Image width
	 * @param {number} imgHeight - Image height
	 */
	function processImage(img, imgWidth, imgHeight) {
		if (!fabricCanvas || !img) return;
		
		// Resize canvas to match image dimensions (or keep current if larger)
		const currentCanvasWidth = fabricCanvas.width;
		const currentCanvasHeight = fabricCanvas.height;
		
		// Update canvas size to match image, but don't shrink if canvas is larger
		const newWidth = Math.max(currentCanvasWidth, imgWidth);
		const newHeight = Math.max(currentCanvasHeight, imgHeight);
		
		if (newWidth !== currentCanvasWidth || newHeight !== currentCanvasHeight) {
			fabricCanvas.setDimensions({
				width: newWidth,
				height: newHeight
			});
			canvasWidth.set(newWidth);
			canvasHeight.set(newHeight);
		}
		
		// Get final canvas dimensions
		const finalCanvasWidth = fabricCanvas.width;
		const finalCanvasHeight = fabricCanvas.height;
		
		// Calculate scale to fit canvas while maintaining aspect ratio
		// Use 95% of canvas to leave some padding
		const padding = 0.95;
		const scaleX = (finalCanvasWidth * padding) / imgWidth;
		const scaleY = (finalCanvasHeight * padding) / imgHeight;
		const scale = Math.min(scaleX, scaleY);
		
		// Apply scale
		img.scale(scale);
		
		// Calculate scaled dimensions
		const scaledWidth = imgWidth * scale;
		const scaledHeight = imgHeight * scale;
		
		// Center the image on canvas
		img.set({
			left: (finalCanvasWidth - scaledWidth) / 2,
			top: (finalCanvasHeight - scaledHeight) / 2,
			selectable: true,
			hasControls: true,
			hasBorders: true,
			hasRotatingPoint: true,
			lockUniScaling: false
		});
		
		// Set a name for the layer
		img.name = 'image';
		
		// Add image to canvas
		fabricCanvas.add(img);
		fabricCanvas.setActiveObject(img);
		
		// Update canvas instance to trigger reactivity
		canvasInstance.set(fabricCanvas);
		
		// Force render multiple times to ensure it displays
		fabricCanvas.renderAll();
		requestAnimationFrame(() => {
			fabricCanvas.renderAll();
			requestAnimationFrame(() => {
				fabricCanvas.renderAll();
				// Save state after rendering
				saveState();
			});
		});
	}
	
	/**
	 * Save current canvas state to history for undo/redo
	 */
	function saveState() {
		if (!fabricCanvas) return;
		const json = JSON.stringify(fabricCanvas.toJSON());
		history = history.slice(0, historyIndex + 1);
		history.push(json);
		historyIndex = history.length - 1;
		// Limit history to 50 states
		if (history.length > 50) {
			history.shift();
			historyIndex--;
		}
	}
	
	/**
	 * Undo last action
	 */
	function undo() {
		if (historyIndex > 0 && fabricCanvas) {
			historyIndex--;
			fabricCanvas.loadFromJSON(history[historyIndex], () => {
				fabricCanvas.renderAll();
			});
		}
	}
	
	/**
	 * Redo last undone action
	 */
	function redo() {
		if (historyIndex < history.length - 1 && fabricCanvas) {
			historyIndex++;
			fabricCanvas.loadFromJSON(history[historyIndex], () => {
				fabricCanvas.renderAll();
			});
		}
	}
	
	/**
	 * Handle double-click on objects (for text editing)
	 */
	function handleDoubleClick(e) {
		if (!fabricCanvas || !fabricLib) return;
		const obj = e.target;
		
		if (obj && (obj.type === 'textbox' || obj.type === 'text')) {
			// Enter text editing mode
			obj.enterEditing();
			fabricCanvas.renderAll();
		}
	}
	
	/**
	 * Copy selected object
	 */
	function copyObject() {
		if (!fabricCanvas) return;
		const activeObject = fabricCanvas.getActiveObject();
		if (activeObject) {
			activeObject.clone((cloned) => {
				copiedObject = cloned;
			});
		}
	}
	
	/**
	 * Paste copied object
	 */
	function pasteObject() {
		if (!fabricCanvas || !copiedObject) return;
		copiedObject.clone((cloned) => {
			cloned.set({
				left: cloned.left + 10,
				top: cloned.top + 10
			});
			fabricCanvas.add(cloned);
			fabricCanvas.setActiveObject(cloned);
			fabricCanvas.renderAll();
			saveState();
		});
	}
	
	/**
	 * Duplicate selected object
	 */
	function duplicateObject() {
		if (!fabricCanvas) return;
		const activeObject = fabricCanvas.getActiveObject();
		if (activeObject) {
			activeObject.clone((cloned) => {
				cloned.set({
					left: cloned.left + 10,
					top: cloned.top + 10
				});
				fabricCanvas.add(cloned);
				fabricCanvas.setActiveObject(cloned);
				fabricCanvas.renderAll();
				saveState();
			});
		}
	}
	
	/**
	 * Handle image upload from canvas setup modal
	 */
	async function handleCanvasImageUpload(event) {
		const file = event.detail.file;
		if (file) {
			// Ensure canvas is initialized first
			if (!isFabricReady) {
				await initFabric();
			}
			// Wait a bit for canvas to be fully ready
			await new Promise(resolve => setTimeout(resolve, 100));
			handleImageUpload({ target: { files: [file] } });
		}
	}
	
	/**
	 * Component lifecycle: Initialize on mount
	 */
	onMount(async () => {
		// Wait for canvas setup to complete before initializing
		// If canvas is already initialized, skip setup modal
		if ($canvasInitialized) {
			await initFabric();
		}
		
		// Listen for filter application events
		window.addEventListener('applyFilters', handleApplyFilters);
		window.addEventListener('undo', () => undo());
		window.addEventListener('redo', () => redo());
		window.addEventListener('canvasImageUpload', handleCanvasImageUpload);
		
		// Keyboard shortcuts
		const handleKeyDown = (e) => {
			// Track Shift key for perfect shapes
			if (e.key === 'Shift') {
				isShiftPressed = true;
			}
			
			// Delete selected object
			if (e.key === 'Delete' || e.key === 'Backspace') {
				if (fabricCanvas) {
					const activeObject = fabricCanvas.getActiveObject();
					if (activeObject) {
						fabricCanvas.remove(activeObject);
						fabricCanvas.renderAll();
						saveState();
					}
				}
			}
			
			// Undo/Redo shortcuts
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
				} else if (e.key === 'c') {
					e.preventDefault();
					copyObject();
				} else if (e.key === 'v') {
					e.preventDefault();
					pasteObject();
				} else if (e.key === 'd') {
					e.preventDefault();
					duplicateObject();
				}
			}
			
			// Tool shortcuts (only if not using Ctrl/Cmd)
			if (!e.ctrlKey && !e.metaKey && !e.altKey) {
				switch (e.key.toLowerCase()) {
					case 'v':
						e.preventDefault();
						activeTool.set('select');
						break;
					case 't':
						e.preventDefault();
						activeTool.set('text');
						break;
					case 'b':
						e.preventDefault();
						activeTool.set('freedraw');
						break;
					case 'l':
						e.preventDefault();
						activeTool.set('lasso');
						break;
					case 'w':
						e.preventDefault();
						activeTool.set('magicwand');
						break;
					case 'g':
						e.preventDefault();
						activeTool.set('gradient');
						break;
				}
			}
		};
		
		const handleKeyUp = (e) => {
			if (e.key === 'Shift') {
				isShiftPressed = false;
			}
		};
		
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		
		// Cleanup on component destroy
		return () => {
			window.removeEventListener('applyFilters', handleApplyFilters);
			window.removeEventListener('undo', () => undo());
			window.removeEventListener('redo', () => redo());
			window.removeEventListener('canvasImageUpload', handleCanvasImageUpload);
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
			if (fabricCanvas) {
				fabricCanvas.dispose();
			}
		};
	});
	
	/**
	 * Reactive: Initialize canvas when setup is complete
	 */
	$: if ($canvasInitialized && !isFabricReady && canvasContainer && !showCanvasSetup) {
		initFabric();
	}
	
	/**
	 * Reactive statement to update brush properties when they change
	 */
	$: if (fabricCanvas && fabricCanvas.freeDrawingBrush && $activeTool === 'freedraw') {
		fabricCanvas.freeDrawingBrush.width = $brushSize;
		fabricCanvas.freeDrawingBrush.color = $brushColor;
		fabricCanvas.freeDrawingBrush.opacity = $brushOpacity / 100;
	}
</script>

<!-- Professional Layout: Left Toolbar | Main Canvas Area | Right Panels -->
<div class="flex h-full w-full bg-[#1a1a1a]">
	<!-- Left Toolbar -->
	<ImageToolbar />
	
	<!-- Main Canvas Area -->
	<div class="flex-1 flex flex-col overflow-hidden">
		<!-- Top Tool Options Bar -->
		<ToolOptionsBar />
		
		<!-- Canvas Container -->
		<div class="flex-1 flex justify-center items-center p-8 md:p-4 overflow-auto bg-[#1a1a1a]">
			<input 
				type="file" 
				accept="image/*" 
				on:change={handleImageUpload}
				id="image-upload"
				class="hidden"
			/>
			<div class="flex flex-col justify-center items-center w-full h-full gap-4">
				{#if !$imageFile}
					<label for="image-upload" class="flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed border-[#4a4a4a] rounded-lg cursor-pointer transition-all duration-200 bg-[#2a2a2a] hover:border-[#4a90e2] hover:bg-[#333]">
						<span class="text-5xl">📁</span>
						<span class="text-white">Click to upload an image</span>
					</label>
				{/if}
				<div class="flex justify-center items-center w-full h-full overflow-auto">
					<canvas 
						bind:this={canvasContainer} 
						class="border border-[#3a3a3a] rounded shadow-lg bg-white"
						style="display: block; max-width: 100%; max-height: 100%; object-fit: contain;"
					></canvas>
				</div>
			</div>
		</div>
		
		<!-- Bottom Status Bar -->
		<StatusBar />
	</div>
	
	<!-- Right Panels -->
	<div class="flex border-l border-[#3a3a3a]">
		<LayersPanel />
		<PropertiesPanel />
	</div>
</div>

<!-- Canvas Setup Modal -->
<CanvasSetupModal />
