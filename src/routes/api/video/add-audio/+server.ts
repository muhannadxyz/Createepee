import { json } from '@sveltejs/kit';
import path from 'path';
import ffmpeg, { runFfmpeg } from '$lib/utils/ffmpeg.server';
import { cleanupTempFiles, ensureTempDir } from '$lib/utils/tempCleanup.server';
import { resolveTempFile, writeTempFile } from '$lib/utils/videoFiles.server';

export const POST = async ({ request }) => {
	await cleanupTempFiles();
	const form = await request.formData();
	const videoId = form.get('videoId');
	const mode = form.get('mode');
	const volumeValue = Number(form.get('volume') ?? 1);
	const audioFileId = form.get('audioFileId');
	const audioFile = form.get('audio');

	if (typeof videoId !== 'string' || (mode !== 'replace' && mode !== 'mix')) {
		return json({ success: false, error: 'Missing required fields.' }, { status: 400 });
	}

	const inputVideo = await resolveTempFile(videoId);
	if (!inputVideo) {
		return json({ success: false, error: 'Video not found.' }, { status: 404 });
	}

	let audioPath: string | null = null;
	if (audioFile instanceof File) {
		const buffer = Buffer.from(await audioFile.arrayBuffer());
		const ext = path.extname(audioFile.name) || '.mp3';
		const audioId = crypto.randomUUID();
		const saved = await writeTempFile(audioId, ext, buffer);
		audioPath = saved.filePath;
	} else if (typeof audioFileId === 'string' && audioFileId.trim()) {
		const resolved = await resolveTempFile(audioFileId.trim());
		if (!resolved) {
			return json({ success: false, error: 'Audio file not found.' }, { status: 404 });
		}
		audioPath = resolved.filePath;
	}

	if (!audioPath) {
		return json({ success: false, error: 'No audio provided.' }, { status: 400 });
	}

	const outputId = crypto.randomUUID();
	const dir = await ensureTempDir();
	const outputPath = path.join(dir, `${outputId}.mp4`);

	try {
		let command = ffmpeg();
		command = command.input(inputVideo.filePath).input(audioPath);

		if (mode === 'replace') {
			command = command.outputOptions([
				'-map 0:v',
				'-map 1:a',
				'-c:v libx264',
				'-c:a aac',
				'-shortest',
				'-movflags +faststart'
			]);
			if (Number.isFinite(volumeValue) && volumeValue !== 1) {
				command = command.audioFilters(`volume=${volumeValue}`);
			}
		} else {
			const safeVolume = Number.isFinite(volumeValue) ? volumeValue : 1;
			const filter = `[1:a]volume=${safeVolume}[a1];[0:a][a1]amix=inputs=2:duration=first:dropout_transition=2[aout]`;
			command = command.complexFilter(filter).outputOptions([
				'-map 0:v',
				'-map [aout]',
				'-c:v libx264',
				'-c:a aac',
				'-shortest',
				'-movflags +faststart'
			]);
		}

		await runFfmpeg(command.save(outputPath));
		return json({ success: true, data: { outputId, outputUrl: `/temp/${outputId}.mp4` } });
	} catch (error: any) {
		return json({ success: false, error: error?.message || 'Audio processing failed.' }, { status: 500 });
	}
};
