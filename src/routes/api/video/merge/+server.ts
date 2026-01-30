import { json } from '@sveltejs/kit';
import path from 'path';
import fs from 'fs/promises';
import ffmpeg, { runFfmpeg } from '$lib/utils/ffmpeg.server';
import { cleanupTempFiles, ensureTempDir } from '$lib/utils/tempCleanup.server';
import { resolveTempFile } from '$lib/utils/videoFiles.server';

export const POST = async ({ request }) => {
	await cleanupTempFiles();
	const body = await request.json().catch(() => null);
	if (!body) {
		return json({ success: false, error: 'Invalid JSON.' }, { status: 400 });
	}
	const { videoIds, order } = body as { videoIds?: string[]; order?: string[] };
	if (!Array.isArray(videoIds) || videoIds.length < 2) {
		return json({ success: false, error: 'Provide at least two video ids.' }, { status: 400 });
	}
	const orderedIds = Array.isArray(order) && order.length ? order : videoIds;
	const inputs = await Promise.all(orderedIds.map((id) => resolveTempFile(id)));
	if (inputs.some((item) => !item)) {
		return json({ success: false, error: 'One or more videos not found.' }, { status: 404 });
	}
	const outputId = crypto.randomUUID();
	const dir = await ensureTempDir();
	const listPath = path.join(dir, `merge-${outputId}.txt`);
	const outputPath = path.join(dir, `${outputId}.mp4`);
	const fileList = inputs
		.map((entry) => `file '${entry!.filePath.replace(/'/g, "'\\''")}'`)
		.join('\n');
	await fs.writeFile(listPath, fileList);

	const command = ffmpeg()
		.input(listPath)
		.inputOptions(['-f concat', '-safe 0'])
		.outputOptions(['-c:v libx264', '-c:a aac', '-movflags +faststart']);

	try {
		await runFfmpeg(command.save(outputPath));
		return json({ success: true, data: { outputId, outputUrl: `/temp/${outputId}.mp4` } });
	} catch (error: any) {
		return json({ success: false, error: error?.message || 'Merge failed.' }, { status: 500 });
	}
};
