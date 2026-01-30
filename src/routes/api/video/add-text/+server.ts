import { json } from '@sveltejs/kit';
import path from 'path';
import ffmpeg, { runFfmpeg } from '$lib/utils/ffmpeg.server';
import { cleanupTempFiles, ensureTempDir } from '$lib/utils/tempCleanup.server';
import { resolveTempFile } from '$lib/utils/videoFiles.server';

const escapeText = (value: string) =>
	value.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'");

export const POST = async ({ request }) => {
	await cleanupTempFiles();
	const body = await request.json().catch(() => null);
	if (!body) {
		return json({ success: false, error: 'Invalid JSON.' }, { status: 400 });
	}
	const { videoId, text, x, y, fontSize, color, startTime, endTime } = body as {
		videoId?: string;
		text?: string;
		x?: number;
		y?: number;
		fontSize?: number;
		color?: string;
		startTime?: number;
		endTime?: number;
	};

	if (!videoId || !text || typeof x !== 'number' || typeof y !== 'number' || typeof fontSize !== 'number' || !color) {
		return json({ success: false, error: 'Missing required fields.' }, { status: 400 });
	}
	const input = await resolveTempFile(videoId);
	if (!input) {
		return json({ success: false, error: 'Video not found.' }, { status: 404 });
	}

	const outputId = crypto.randomUUID();
	const dir = await ensureTempDir();
	const outputPath = path.join(dir, `${outputId}.mp4`);
	const safeText = escapeText(text);
	let filter = `drawtext=text='${safeText}':x=${x}:y=${y}:fontsize=${fontSize}:fontcolor=${color}`;
	if (typeof startTime === 'number' && typeof endTime === 'number' && endTime > startTime) {
		filter += `:enable='between(t,${startTime},${endTime})'`;
	}

	const command = ffmpeg(input.filePath)
		.videoFilters(filter)
		.outputOptions(['-c:v libx264', '-c:a aac', '-movflags +faststart']);

	try {
		await runFfmpeg(command.save(outputPath));
		return json({ success: true, data: { outputId, outputUrl: `/temp/${outputId}.mp4` } });
	} catch (error: any) {
		return json({ success: false, error: error?.message || 'Add text failed.' }, { status: 500 });
	}
};
