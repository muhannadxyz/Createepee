import { json } from '@sveltejs/kit';
import path from 'path';
import { cleanupTempFiles } from '$lib/utils/tempCleanup.server';
import { writeTempFile } from '$lib/utils/videoFiles.server';

const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/ogg'];

export const POST = async ({ request }) => {
	await cleanupTempFiles();
	const form = await request.formData();
	const file = form.get('file');
	if (!(file instanceof File)) {
		return json({ success: false, error: 'Missing file.' }, { status: 400 });
	}
	if (!file.type.startsWith('video/')) {
		return json({ success: false, error: 'Invalid file type.' }, { status: 400 });
	}
	if (file.type && !allowedTypes.includes(file.type)) {
		return json({ success: false, error: 'Unsupported video type.' }, { status: 400 });
	}
	const buffer = Buffer.from(await file.arrayBuffer());
	const ext = path.extname(file.name) || '.mp4';
	const videoId = crypto.randomUUID();
	const saved = await writeTempFile(videoId, ext, buffer);

	return json({
		success: true,
		data: {
			videoId,
			url: saved.url,
			originalName: file.name,
			size: file.size
		}
	});
};
