import { writable } from 'svelte/store';

export type ImageTool =
	| 'select'
	| 'hand'
	| 'zoom'
	| 'text'
	| 'crop'
	| 'eyedropper'
	| 'shape'
	| 'brush'
	| 'eraser';

export type ShapeVariant = 'rect' | 'ellipse' | 'line';

export type LayerItem = {
	id: string;
	name: string;
	type: string;
	object: any;
	visible: boolean;
	locked: boolean;
};

export const imageCanvas = writable<any | null>(null);
export const baseImage = writable<any | null>(null);
export const layers = writable<LayerItem[]>([]);

export const currentTool = writable<ImageTool>('select');
export const shapeVariant = writable<ShapeVariant>('rect');
export const selectedObjectIds = writable<string[]>([]);
export const selectedObjects = writable<any[]>([]);

export const zoomLevel = writable(1);
export const panOffset = writable({ x: 0, y: 0 });

export const historyStack = writable<any[]>([]);
export const redoStack = writable<any[]>([]);

export const strokeColor = writable('#ffffff');
export const fillColor = writable('#3b82f6');
export const textColor = writable('#ffffff');
export const strokeWidth = writable(3);

export const brushColor = writable('#ffffff');
export const brushSize = writable(16);
export const brushOpacity = writable(1);

export const fontFamily = writable('Arial');
export const fontSize = writable(32);
export const fontWeight = writable('normal');
export const fontStyle = writable('normal');
export const textAlign = writable<'left' | 'center' | 'right'>('left');

export const adjustments = writable({
	brightness: 0,
	contrast: 0,
	saturation: 0,
	blur: 0
});
