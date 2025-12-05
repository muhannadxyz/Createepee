import { writable } from 'svelte/store';

/**
 * Editor Store
 * 
 * Centralized state management for the editor application.
 * Manages editor mode, tool state, canvas instances, and UI state.
 */

// Editor mode: 'image', 'video', 'document', or 'converter'
export const editorMode = writable('image');

// Active tool state
export const activeTool = writable(null);

// Image editor state
export const canvasInstance = writable(null);
export const imageFile = writable(null);

// Layer metadata store - maps Fabric.js object IDs to layer metadata
// Structure: { [objectId]: { name, visible, locked, opacity } }
export const layerMetadata = writable({});

// Panel visibility state
export const leftPanelCollapsed = writable(false);
export const rightPanelCollapsed = writable(false);
export const layersPanelVisible = writable(true);
export const propertiesPanelVisible = writable(true);

// Brush properties (shared between ImageEditor and PropertiesPanel)
export const brushSize = writable(5);
export const brushOpacity = writable(100);
export const brushFlow = writable(100);
export const brushHardness = writable(50);
export const brushColor = writable('#000000');

// Shape properties (shared between ImageEditor and PropertiesPanel)
export const fillColor = writable('#ffffff');
export const strokeColor = writable('#000000');
export const strokeWidth = writable(2);

// Gradient properties
export const gradientStartColor = writable('#ff0000');
export const gradientEndColor = writable('#0000ff');
export const gradientType = writable('linear');
export const gradientAngle = writable(0);

// Video editor state
export const videoFile = writable(null);
export const videoClips = writable([]);
export const videoTimeline = writable([]);
export const processedVideoPath = writable(null);

// Export state
export const showExportModal = writable(false);
export const exportType = writable(null); // 'image' or 'video'

// Canvas setup state
export const showCanvasSetup = writable(true); // Show on first load
export const canvasWidth = writable(800);
export const canvasHeight = writable(600);
export const canvasBackgroundColor = writable('#ffffff');
export const canvasInitialized = writable(false);

