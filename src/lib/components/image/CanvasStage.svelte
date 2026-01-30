<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import {
		imageCanvas,
		baseImage,
		layers,
		selectedObjectIds,
		selectedObjects,
		currentTool,
		strokeColor,
		fillColor,
		strokeWidth,
		textColor,
		brushColor,
		brushSize,
		brushOpacity,
		fontFamily,
		fontSize,
		fontWeight,
		fontStyle,
		textAlign,
		shapeVariant,
		zoomLevel,
		panOffset,
		historyStack,
		redoStack
	} from '$lib/stores/imageEditor.store';
	import { setUiStatus } from '$lib/stores/ui.store';
	import { buildLayers, ensureObjectId, initCanvas, setTool } from '$lib/utils/fabricTools';

	let container: HTMLDivElement;
	let canvasElement: HTMLCanvasElement;
	let canvas: any;
	let fabric: any;
	let isPanning = false;
	let lastPos = { x: 0, y: 0 };
	let cropRect: any = null;
	let isRestoring = false;

	const resizeCanvas = () => {
		if (!canvas || !container) return;
		const bounds = container.getBoundingClientRect();
		const width = Math.max(300, Math.floor(bounds.width));
		const height = Math.max(300, Math.floor(bounds.height));
		canvas.setWidth(width);
		canvas.setHeight(height);
		canvas.requestRenderAll();
	};

	const syncLayers = () => {
		if (!canvas) return;
		layers.set(buildLayers(canvas));
	};

	const syncSelection = () => {
		if (!canvas) return;
		const active = canvas.getActiveObjects();
		active.forEach((obj: any) => ensureObjectId(obj));
		selectedObjects.set(active);
		selectedObjectIds.set(active.map((obj: any) => obj.__id));
		if (active.length === 1) {
			const obj: any = active[0];
			if (obj.type === 'textbox') {
				textColor.set(obj.fill || get(textColor));
				fontFamily.set(obj.fontFamily || get(fontFamily));
				fontSize.set(obj.fontSize || get(fontSize));
				fontWeight.set(obj.fontWeight || get(fontWeight));
				fontStyle.set(obj.fontStyle || get(fontStyle));
				textAlign.set(obj.textAlign || get(textAlign));
			}
			if (['rect', 'ellipse', 'circle', 'line'].includes(obj.type)) {
				if (obj.fill) fillColor.set(obj.fill);
				if (obj.stroke) strokeColor.set(obj.stroke);
				if (obj.strokeWidth) strokeWidth.set(obj.strokeWidth);
			}
		}
	};

	const pushHistory = () => {
		if (!canvas || isRestoring) return;
		const snapshot = canvas.toDatalessJSON(['__id', '__name']);
		historyStack.update((stack) => {
			const next = [...stack, snapshot];
			return next.length > 50 ? next.slice(next.length - 50) : next;
		});
		redoStack.set([]);
	};

	const restoreHistory = (snapshot: any) => {
		if (!canvas) return;
		isRestoring = true;
		canvas.loadFromJSON(snapshot, () => {
			canvas.renderAll();
			isRestoring = false;
			syncLayers();
			syncSelection();
		});
	};

	const undo = () => {
		const stack = get(historyStack);
		if (stack.length < 2) return;
		const current = stack[stack.length - 1];
		const prev = stack[stack.length - 2];
		redoStack.update((redo) => [...redo, current]);
		historyStack.set(stack.slice(0, -1));
		restoreHistory(prev);
	};

	const redo = () => {
		const redo = get(redoStack);
		if (!redo.length) return;
		const snapshot = redo[redo.length - 1];
		redoStack.set(redo.slice(0, -1));
		historyStack.update((stack) => [...stack, snapshot]);
		restoreHistory(snapshot);
	};

	const handleUpload = async (event: Event) => {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		setUiStatus('image', 'loading', 'Uploading image...');
		try {
			const dataUrl = await new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => resolve(reader.result as string);
				reader.onerror = () => reject(reader.error);
				reader.readAsDataURL(file);
			});

			fabric.Image.fromURL(dataUrl, (img: any) => {
				const currentBase = get(baseImage);
				if (currentBase && canvas) {
					canvas.remove(currentBase);
				}
				const bounds = container.getBoundingClientRect();
				const scale = Math.min(bounds.width / img.width, bounds.height / img.height, 1);
				img.set({ left: 0, top: 0, selectable: true });
				img.scale(scale);
				ensureObjectId(img);
				canvas.add(img);
				canvas.sendToBack(img);
				baseImage.set(img);
				canvas.requestRenderAll();
				syncLayers();
				pushHistory();
				setUiStatus('image', 'success', 'Image loaded');
			});
		} catch (error: any) {
			setUiStatus('image', 'error', error?.message || 'Failed to load image');
		}
		input.value = '';
	};

	const applyTool = () => {
		if (!canvas) return;
		setTool(canvas, get(currentTool), {
			stroke: get(strokeColor),
			fill: get(fillColor),
			strokeWidth: get(strokeWidth),
			textColor: get(textColor),
			brushColor: get(brushColor),
			brushSize: get(brushSize),
			brushOpacity: get(brushOpacity),
			fontFamily: get(fontFamily),
			fontSize: get(fontSize),
			fontWeight: get(fontWeight),
			fontStyle: get(fontStyle),
			textAlign: get(textAlign),
			shapeVariant: get(shapeVariant)
		});
	};

	const isEditableTarget = (target: EventTarget | null) => {
		if (!(target instanceof HTMLElement)) return false;
		return (
			target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.isContentEditable
		);
	};

	const setZoomAtPoint = (point: { x: number; y: number }, zoom: number) => {
		if (!canvas || !fabric) return;
		const clamped = Math.min(4, Math.max(0.1, zoom));
		canvas.zoomToPoint(new fabric.Point(point.x, point.y), clamped);
		zoomLevel.set(clamped);
	};

	const applyCrop = () => {
		if (!canvas || !cropRect) return;
		const rect = cropRect.getBoundingRect();
		const dataUrl = canvas.toDataURL({
			format: 'png',
			left: rect.left,
			top: rect.top,
			width: rect.width,
			height: rect.height
		});
		canvas.clear();
		fabric.Image.fromURL(dataUrl, (img: any) => {
			img.set({ left: 0, top: 0, selectable: true });
			ensureObjectId(img);
			canvas.add(img);
			baseImage.set(img);
			cropRect = null;
			canvas.requestRenderAll();
			syncLayers();
			pushHistory();
		});
	};

	const cancelCrop = () => {
		if (!canvas || !cropRect) return;
		canvas.remove(cropRect);
		cropRect = null;
		canvas.requestRenderAll();
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (!canvas) return;
		if (isEditableTarget(event.target)) return;
		const active = canvas.getActiveObject();
		if (active?.isEditing) return;

		if (event.key === ' ') {
			event.preventDefault();
			canvas.__spacePressed = true;
			canvas.defaultCursor = 'grab';
			return;
		}

		const key = event.key.toLowerCase();
		if (key === 'v') currentTool.set('select');
		if (key === 't') currentTool.set('text');
		if (key === 'b') currentTool.set('brush');
		if (key === 'h') currentTool.set('hand');
		if (key === 'z' && !event.metaKey && !event.ctrlKey) currentTool.set('zoom');
		if (key === 'e') currentTool.set('eraser');
		if (key === 'c') currentTool.set('crop');
		if (key === 'i') currentTool.set('eyedropper');
		if (key === 'u') {
			const cycle = ['rect', 'ellipse', 'line'];
			const current = get(shapeVariant);
			const idx = cycle.indexOf(current);
			shapeVariant.set(cycle[(idx + 1) % cycle.length] as any);
			currentTool.set('shape');
		}

		if ((event.metaKey || event.ctrlKey) && key === 'd') {
			event.preventDefault();
			const activeObjects = canvas.getActiveObjects();
			if (!activeObjects.length) return;
			activeObjects.forEach((obj: any) => {
				obj.clone((cloned: any) => {
					cloned.set({ left: (obj.left ?? 0) + 10, top: (obj.top ?? 0) + 10 });
					ensureObjectId(cloned);
					canvas.add(cloned);
					canvas.setActiveObject(cloned);
					canvas.requestRenderAll();
					pushHistory();
				});
			});
		}

		if ((event.metaKey || event.ctrlKey) && key === 'g') {
			event.preventDefault();
			const activeObj = canvas.getActiveObject();
			if (event.shiftKey) {
				if (activeObj && activeObj.type === 'group') {
					activeObj.toActiveSelection();
					canvas.requestRenderAll();
				}
			} else {
				if (activeObj && activeObj.type === 'activeSelection') {
					activeObj.toGroup();
					canvas.requestRenderAll();
				}
			}
			pushHistory();
		}

		if ((event.metaKey || event.ctrlKey) && key === 'z') {
			event.preventDefault();
			if (event.shiftKey) {
				redo();
			} else {
				undo();
			}
		}

		if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
			event.preventDefault();
			const delta = event.shiftKey ? 10 : 1;
			const activeObjects = canvas.getActiveObjects();
			if (!activeObjects.length) return;
			activeObjects.forEach((obj: any) => {
				switch (key) {
					case 'arrowup':
						obj.top -= delta;
						break;
					case 'arrowdown':
						obj.top += delta;
						break;
					case 'arrowleft':
						obj.left -= delta;
						break;
					case 'arrowright':
						obj.left += delta;
						break;
				}
				obj.setCoords();
			});
			canvas.requestRenderAll();
			pushHistory();
		}

		if (key === 'backspace' || key === 'delete') {
			event.preventDefault();
			const activeObjects = canvas.getActiveObjects();
			if (!activeObjects.length) return;
			activeObjects.forEach((obj: any) => canvas.remove(obj));
			canvas.discardActiveObject();
			canvas.requestRenderAll();
			syncLayers();
			syncSelection();
			pushHistory();
		}
	};

	const handleKeyUp = (event: KeyboardEvent) => {
		if (event.key === ' ') {
			canvas.__spacePressed = false;
			canvas.defaultCursor = get(currentTool) === 'hand' ? 'grab' : 'default';
		}
	};

	onMount(async () => {
		fabric = (await import('fabric')).fabric;
		canvas = initCanvas(fabric, canvasElement);
		imageCanvas.set(canvas);
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		canvas.on('object:added', (event: any) => {
			syncLayers();
			if (event?.target && event.target === cropRect) return;
			pushHistory();
		});
		canvas.on('object:removed', syncLayers);
		canvas.on('object:modified', () => {
			syncLayers();
			pushHistory();
		});
		canvas.on('selection:created', syncSelection);
		canvas.on('selection:updated', syncSelection);
		canvas.on('selection:cleared', syncSelection);

		canvas.on('mouse:down', (opt: any) => {
			const tool = get(currentTool);
			if (canvas.__spacePressed || tool === 'hand') {
				isPanning = true;
				lastPos = { x: opt.e.clientX, y: opt.e.clientY };
				canvas.defaultCursor = 'grabbing';
				canvas.discardActiveObject();
				return;
			}

			if (tool === 'zoom') {
				opt.e.preventDefault();
				const pointer = canvas.getPointer(opt.e, true);
				const zoom = canvas.getZoom();
				const next = opt.e.altKey || opt.e.metaKey ? zoom / 1.2 : zoom * 1.2;
				setZoomAtPoint(pointer, next);
				return;
			}

			if (tool === 'eyedropper') {
				const ctx = canvas.lowerCanvasEl.getContext('2d');
				const pointer = canvas.getPointer(opt.e, true);
				if (!ctx) return;
				const pixel = ctx.getImageData(Math.round(pointer.x), Math.round(pointer.y), 1, 1).data;
				const color = `#${[pixel[0], pixel[1], pixel[2]]
					.map((v) => v.toString(16).padStart(2, '0'))
					.join('')}`;
				const active = canvas.getActiveObject();
				if (active?.type === 'textbox') {
					textColor.set(color);
					active.set('fill', color);
				} else if (active?.type) {
					fillColor.set(color);
					active.set('fill', color);
				} else {
					fillColor.set(color);
				}
				canvas.requestRenderAll();
				return;
			}
		});

		canvas.on('mouse:move', (opt: any) => {
			if (!isPanning) return;
			const delta = { x: opt.e.clientX - lastPos.x, y: opt.e.clientY - lastPos.y };
			lastPos = { x: opt.e.clientX, y: opt.e.clientY };
			const vpt = canvas.viewportTransform;
			if (vpt) {
				vpt[4] += delta.x;
				vpt[5] += delta.y;
				canvas.requestRenderAll();
				panOffset.set({ x: vpt[4], y: vpt[5] });
			}
		});

		canvas.on('mouse:up', () => {
			if (isPanning) {
				isPanning = false;
				canvas.defaultCursor = get(currentTool) === 'hand' ? 'grab' : 'default';
			}
		});

		canvas.on('mouse:wheel', (opt: any) => {
			if (!opt.e.ctrlKey && !opt.e.metaKey) return;
			opt.e.preventDefault();
			opt.e.stopPropagation();
			const pointer = canvas.getPointer(opt.e, true);
			let zoom = canvas.getZoom();
			const zoomFactor = 0.999 ** opt.e.deltaY;
			zoom *= zoomFactor;
			setZoomAtPoint(pointer, zoom);
		});

		applyTool();
		pushHistory();

		const toolUnsub = currentTool.subscribe((tool) => {
			applyTool();
			if (tool === 'crop') {
				if (!cropRect) {
					const width = canvas.getWidth() * 0.6;
					const height = canvas.getHeight() * 0.6;
					cropRect = new fabric.Rect({
						left: (canvas.getWidth() - width) / 2,
						top: (canvas.getHeight() - height) / 2,
						width,
						height,
						fill: 'rgba(0,0,0,0.1)',
						stroke: '#4b8bff',
						strokeDashArray: [6, 4],
						selectable: true,
						evented: true
					});
					canvas.add(cropRect);
					canvas.setActiveObject(cropRect);
					canvas.requestRenderAll();
				}
			} else if (cropRect) {
				cancelCrop();
			}
		});
		const colorUnsub = strokeColor.subscribe(() => applyTool());
		const fillUnsub = fillColor.subscribe(() => applyTool());
		const widthUnsub = strokeWidth.subscribe(() => applyTool());
		const textUnsub = textColor.subscribe(() => applyTool());
		const brushUnsub = brushColor.subscribe(() => applyTool());
		const brushSizeUnsub = brushSize.subscribe(() => applyTool());
		const brushOpacityUnsub = brushOpacity.subscribe(() => applyTool());
		const fontUnsub = fontFamily.subscribe(() => applyTool());
		const fontSizeUnsub = fontSize.subscribe(() => applyTool());
		const weightUnsub = fontWeight.subscribe(() => applyTool());
		const styleUnsub = fontStyle.subscribe(() => applyTool());
		const alignUnsub = textAlign.subscribe(() => applyTool());
		const shapeUnsub = shapeVariant.subscribe(() => applyTool());

		canvas.__applyCrop = applyCrop;
		canvas.__cancelCrop = cancelCrop;

		return () => {
			toolUnsub();
			colorUnsub();
			fillUnsub();
			widthUnsub();
			textUnsub();
			brushUnsub();
			brushSizeUnsub();
			brushOpacityUnsub();
			fontUnsub();
			fontSizeUnsub();
			weightUnsub();
			styleUnsub();
			alignUnsub();
			shapeUnsub();
			window.removeEventListener('resize', resizeCanvas);
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
			canvas.dispose();
		};
	});
</script>

<div class="h-full flex flex-col gap-2">
	<div class="flex items-center justify-between gap-3 text-xs text-[#9aa]">
		<label>Upload image (JPG/PNG)</label>
		<input type="file" accept="image/png,image/jpeg" on:change={handleUpload} class="text-xs" />
	</div>
	<div
		bind:this={container}
		class="flex-1 rounded-lg border border-[#2a2a2a] bg-[#111] relative overflow-hidden"
		style="background-image: linear-gradient(45deg, #1c1c1c 25%, transparent 25%), linear-gradient(-45deg, #1c1c1c 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1c1c1c 75%), linear-gradient(-45deg, transparent 75%, #1c1c1c 75%); background-size: 24px 24px; background-position: 0 0, 0 12px, 12px -12px, -12px 0;"
	>
		<canvas bind:this={canvasElement} class="w-full h-full shadow-[0_8px_30px_rgba(0,0,0,0.45)]" />
	</div>
</div>
