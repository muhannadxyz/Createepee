import { writable } from 'svelte/store';
import type { StatusState } from './ui.store';

export type VideoClip = {
	id: string;
	url: string;
	originalName: string;
	size: number;
};

export const clips = writable<VideoClip[]>([]);
export const selectedClipId = writable<string | null>(null);
export const trimRange = writable({ startTime: 0, endTime: 5 });
export const outputInfo = writable<{ outputId: string | null; outputUrl: string | null }>({
	outputId: null,
	outputUrl: null
});
export const videoStatus = writable<{ status: StatusState; message?: string }>({
	status: 'idle',
	message: ''
});
