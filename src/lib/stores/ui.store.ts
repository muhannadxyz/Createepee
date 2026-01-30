import { writable } from 'svelte/store';

export type StatusState = 'idle' | 'loading' | 'success' | 'error';

export type UiStatus = {
	status: StatusState;
	message?: string;
};

const createStatus = (): UiStatus => ({ status: 'idle', message: '' });

export const uiStatus = writable<{ image: UiStatus; video: UiStatus }>(
	{ image: createStatus(), video: createStatus() }
);

export const setUiStatus = (scope: 'image' | 'video', status: StatusState, message = '') => {
	uiStatus.update((current) => ({
		...current,
		[scope]: { status, message }
	}));
};
