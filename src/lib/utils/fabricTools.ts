export type ToolName =
	| 'select'
	| 'hand'
	| 'zoom'
	| 'text'
	| 'crop'
	| 'eyedropper'
	| 'brush'
	| 'eraser'
	| 'shape';

export type ShapeVariant = 'rect' | 'ellipse' | 'line';

export const ensureObjectId = (obj: any) => {
	if (!obj.__id) {
		obj.__id = crypto.randomUUID();
	}
	return obj.__id as string;
};

const defaultNameForType = (type: string, index: number) => {
	if (type === 'textbox') return `Text ${index}`;
	if (type === 'rect') return `Rectangle ${index}`;
	if (type === 'ellipse') return `Ellipse ${index}`;
	if (type === 'line') return `Line ${index}`;
	if (type === 'image') return index === 1 ? 'Image' : `Image ${index}`;
	if (type === 'path') return `Brush Stroke ${index}`;
	return `${type} ${index}`;
};

export const getLayerName = (canvas: any, obj: any) => {
	if (obj.__name) return obj.__name as string;
	const type = obj.type || 'object';
	const sameType = canvas.getObjects().filter((item: any) => item.type === type);
	const index = sameType.indexOf(obj) + 1;
	const name = defaultNameForType(type, Math.max(index, 1));
	obj.__name = name;
	return name;
};

export const initCanvas = (fabric: any, canvasElement: HTMLCanvasElement) => {
	const canvas = new fabric.Canvas(canvasElement, {
		backgroundColor: '#111',
		preserveObjectStacking: true,
		selection: true
	});
	canvas.selectionKey = 'shiftKey';
	canvas.fabric = fabric;
	return canvas;
};

const toRgba = (hex: string, opacity: number) => {
	const normalized = hex.replace('#', '');
	const value = normalized.length === 3
		? normalized.split('').map((c) => c + c).join('')
		: normalized;
	const num = parseInt(value, 16);
	const r = (num >> 16) & 255;
	const g = (num >> 8) & 255;
	const b = num & 255;
	return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const clearToolHandlers = (canvas: any) => {
	if (canvas.__toolHandlers) {
		const { mouseDown, mouseMove, mouseUp } = canvas.__toolHandlers;
		canvas.off('mouse:down', mouseDown);
		canvas.off('mouse:move', mouseMove);
		canvas.off('mouse:up', mouseUp);
		canvas.__toolHandlers = null;
	}
};

export const setTool = (
	canvas: any,
	tool: ToolName,
	options: {
		stroke: string;
		fill: string;
		strokeWidth: number;
		textColor: string;
		brushColor: string;
		brushSize: number;
		brushOpacity: number;
		fontFamily: string;
		fontSize: number;
		fontWeight: string;
		fontStyle: string;
		textAlign: string;
		shapeVariant: ShapeVariant;
	}
) => {
	if (!canvas) return;
	clearToolHandlers(canvas);
	canvas.isDrawingMode = false;
	canvas.selection = tool === 'select';
	canvas.defaultCursor = tool === 'hand' ? 'grab' : tool === 'select' ? 'default' : 'crosshair';

	if (tool === 'brush') {
		canvas.isDrawingMode = true;
		canvas.freeDrawingBrush.color = toRgba(options.brushColor, options.brushOpacity);
		canvas.freeDrawingBrush.width = options.brushSize;
		return;
	}

	if (tool === 'select' || tool === 'hand' || tool === 'zoom' || tool === 'crop' || tool === 'eyedropper') return;

	let isDown = false;
	let shape: any = null;
	let startX = 0;
	let startY = 0;
	const resolvedTool = tool === 'shape' ? options.shapeVariant : tool;

	const mouseDown = (opt: any) => {
		if (canvas.__spacePressed || tool === 'hand') return;
		const pointer = canvas.getPointer(opt.e);
		isDown = true;
		startX = pointer.x;
		startY = pointer.y;

		if (tool === 'eraser') {
			const target = opt.target;
			if (target) {
				canvas.remove(target);
				canvas.requestRenderAll();
			}
			isDown = false;
			return;
		}

		if (tool === 'text') {
			const text = new canvas.fabric.Textbox('Text', {
				left: startX,
				top: startY,
				fontSize: options.fontSize,
				fontFamily: options.fontFamily,
				fontWeight: options.fontWeight,
				fontStyle: options.fontStyle,
				textAlign: options.textAlign,
				fill: options.textColor
			});
			ensureObjectId(text);
			canvas.add(text);
			canvas.setActiveObject(text);
			canvas.requestRenderAll();
			isDown = false;
			return;
		}

		if (resolvedTool === 'rect') {
			shape = new canvas.fabric.Rect({
				left: startX,
				top: startY,
				width: 0,
				height: 0,
				fill: options.fill,
				stroke: options.stroke,
				strokeWidth: options.strokeWidth
			});
		}

		if (resolvedTool === 'ellipse') {
			shape = new canvas.fabric.Ellipse({
				left: startX,
				top: startY,
				rx: 1,
				ry: 1,
				fill: options.fill,
				stroke: options.stroke,
				strokeWidth: options.strokeWidth
			});
		}

		if (resolvedTool === 'line') {
			shape = new canvas.fabric.Line([startX, startY, startX, startY], {
				stroke: options.stroke,
				strokeWidth: options.strokeWidth
			});
		}

		if (shape) {
			ensureObjectId(shape);
			canvas.add(shape);
		}
	};

	const mouseMove = (opt: any) => {
		if (!isDown || !shape) return;
		const pointer = canvas.getPointer(opt.e);
		const shift = opt.e.shiftKey;

		if (resolvedTool === 'rect') {
			let width = Math.abs(pointer.x - startX);
			let height = Math.abs(pointer.y - startY);
			if (shift) {
				const size = Math.max(width, height);
				width = size;
				height = size;
			}
			shape.set({ width, height });
			shape.set({ left: Math.min(pointer.x, startX), top: Math.min(pointer.y, startY) });
		}

		if (resolvedTool === 'ellipse') {
			let rx = Math.abs(pointer.x - startX) / 2;
			let ry = Math.abs(pointer.y - startY) / 2;
			if (shift) {
				const radius = Math.max(rx, ry);
				rx = radius;
				ry = radius;
			}
			shape.set({ rx, ry, left: Math.min(pointer.x, startX), top: Math.min(pointer.y, startY) });
		}

		if (resolvedTool === 'line') {
			shape.set({ x2: pointer.x, y2: pointer.y });
		}

		canvas.requestRenderAll();
	};

	const mouseUp = () => {
		isDown = false;
		shape = null;
	};

	canvas.on('mouse:down', mouseDown);
	canvas.on('mouse:move', mouseMove);
	canvas.on('mouse:up', mouseUp);
	canvas.__toolHandlers = { mouseDown, mouseMove, mouseUp };
};

export const applyPropertiesToSelection = (canvas: any, props: Record<string, any>) => {
	if (!canvas) return;
	const active = canvas.getActiveObjects();
	if (!active.length) return;
	active.forEach((obj: any) => {
		Object.entries(props).forEach(([key, value]) => {
			if (value !== undefined) obj.set(key, value);
		});
		obj.setCoords();
	});
	canvas.requestRenderAll();
};

export const applyFilters = (fabric: any, image: any, filtersState: any) => {
	if (!image) return;
	const { brightness, contrast, saturation, blur } = filtersState;
	image.filters = [
		new fabric.Image.filters.Brightness({ brightness }),
		new fabric.Image.filters.Contrast({ contrast }),
		new fabric.Image.filters.Saturation({ saturation }),
		new fabric.Image.filters.Blur({ blur })
	];
	image.applyFilters();
};

export const buildLayers = (canvas: any) => {
	if (!canvas) return [];
	const objects = canvas.getObjects();
	const layers = objects.map((obj: any) => {
		ensureObjectId(obj);
		return {
			id: obj.__id,
			name: getLayerName(canvas, obj),
			type: obj.type,
			object: obj,
			visible: obj.visible !== false,
			locked: obj.selectable === false
		};
	});
	return layers.reverse();
};

export const renameLayer = (canvas: any, layerId: string, name: string) => {
	const obj = canvas.getObjects().find((item: any) => item.__id === layerId);
	if (!obj) return;
	obj.__name = name;
};

export const toggleLayerVisibility = (canvas: any, layerId: string) => {
	const obj = canvas.getObjects().find((item: any) => item.__id === layerId);
	if (!obj) return;
	obj.visible = !obj.visible;
	canvas.requestRenderAll();
};

export const toggleLayerLock = (canvas: any, layerId: string) => {
	const obj = canvas.getObjects().find((item: any) => item.__id === layerId);
	if (!obj) return;
	const shouldLock = obj.selectable !== false;
	obj.selectable = !shouldLock;
	obj.evented = !shouldLock;
	obj.lockMovementX = shouldLock;
	obj.lockMovementY = shouldLock;
	obj.lockScalingX = shouldLock;
	obj.lockScalingY = shouldLock;
	obj.lockRotation = shouldLock;
	obj.hasControls = !shouldLock;
	canvas.requestRenderAll();
};

export const reorderLayer = (canvas: any, fromIndex: number, toIndex: number) => {
	const objects = canvas.getObjects();
	const total = objects.length;
	const fromCanvasIndex = total - 1 - fromIndex;
	const toCanvasIndex = total - 1 - toIndex;
	const obj = objects[fromCanvasIndex];
	if (!obj) return;
	canvas.moveTo(obj, toCanvasIndex);
	canvas.requestRenderAll();
};
