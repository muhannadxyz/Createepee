import { json } from '@sveltejs/kit';
import { cleanupTempFiles } from '$lib/utils/tempCleanup.server';
import { resolveTempFile } from '$lib/utils/videoFiles.server';

export const GET = async ({ url }) => {
	await cleanupTempFiles();
	const outputId = url.searchParams.get('outputId');
	if (!outputId) {
		return json({ success: false, error: 'Missing outputId.' }, { status: 400 });
	}
	const file = await resolveTempFile(outputId);
	if (!file) {
		return json({ success: false, error: 'Output not found.' }, { status: 404 });
	}
	return json({ success: true, data: { downloadUrl: file.url } });
};
