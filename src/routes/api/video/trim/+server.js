import { json } from '@sveltejs/kit';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { readFile, writeFile, unlink } from 'fs/promises';

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export async function POST({ request }) {
	try {
		const { filePath, startTime, endTime } = await request.json();

		if (!filePath || startTime === undefined || endTime === undefined) {
			return json({ error: 'Missing required parameters' }, { status: 400 });
		}

		const inputPath = join(process.cwd(), 'static', filePath.replace('/temp/', 'temp/'));
		const outputId = randomUUID();
		const outputPath = join(process.cwd(), 'static', 'temp', `${outputId}.mp4`);

		return new Promise((resolve, reject) => {
			const duration = endTime - startTime;

			ffmpeg(inputPath)
				.setStartTime(startTime)
				.setDuration(duration)
				.output(outputPath)
				.on('end', () => {
					resolve(json({
						success: true,
						fileId: outputId,
						filePath: `/temp/${outputId}.mp4`
					}));
				})
				.on('error', (err) => {
					console.error('FFmpeg error:', err);
					reject(json({ error: 'Failed to trim video' }, { status: 500 }));
				})
				.run();
		});
	} catch (error) {
		console.error('Trim error:', error);
		return json({ error: 'Failed to trim video' }, { status: 500 });
	}
}

