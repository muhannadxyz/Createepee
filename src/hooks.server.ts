import { cleanupTempFiles } from '$lib/utils/tempCleanup.server';

cleanupTempFiles().catch(() => undefined);

export const handle = async ({ event, resolve }) => {
	return resolve(event);
};
