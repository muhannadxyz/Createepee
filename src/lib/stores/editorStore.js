import { writable } from 'svelte/store';

// Editor mode: 'image', 'video', 'document', or 'converter'
export const editorMode = writable('image');

// Active tool state
export const activeTool = writable(null);

// Image editor state
export const canvasInstance = writable(null);
export const imageFile = writable(null);

// Video editor state
export const videoFile = writable(null);
export const videoClips = writable([]);
export const videoTimeline = writable([]);
export const processedVideoPath = writable(null);

// Export state
export const showExportModal = writable(false);
export const exportType = writable(null); // 'image' or 'video'

