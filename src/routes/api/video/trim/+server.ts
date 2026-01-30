import { json } from '@sveltejs/kit';
import path from 'path';
import ffmpeg, { runFfmpeg } from '$lib/utils/ffmpeg.server';
import { cleanupTempFiles, ensureTempDir } from '$lib/utils/tempCleanup.server';
import { resolveTempFile } from '$lib/utils/videoFiles.server';

export const POST = async ({ request }) => {
	await cleanupTempFiles();
	const body = await request.json().catch(() => null);
	if (!body) {
		return json({ success: false, error: 'Invalid JSON.' }, { status: 400 });
	}
	const { videoId, startTime, endTime } = body as { videoId?: string; startTime?: number; endTime?: number };
	if (!videoId || typeof startTime !== 'number' || typeof endTime !== 'number') {
		return json({ success: false, error: 'Missing required fields.' }, { status: 400 });
	}
	if (startTime < 0 || endTime <= startTime) {
		return json({ success: false, error: 'Invalid trim range.' }, { status: 400 });
	}
	const input = await resolveTempFile(videoId);
	if (!input) {
		return json({ success: false, error: 'Video not found.' }, { status: 404 });
	}

	const outputId = crypto.randomUUID();
	const dir = await ensureTempDir();
	const outputPath = path.join(dir, `${outputId}.mp4`);

	const command = ffmpeg(input.filePath)
		.setStartTime(startTime)
		.setDuration(endTime - startTime)
		.outputOptions(['-c:v libx264', '-c:a aac', '-movflags +faststart']);

	try {
		await runFfmpeg(command.save(outputPath));
		return json({
			success: true,
			data: { outputId, outputUrl: `/temp/${outputId}.mp4` }
		});
	} catch (error: any) {
		return json({ success: false, error: error?.message || 'Trim failed.' }, { status: 500 });
	}
};
