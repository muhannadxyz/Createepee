import { json } from '@sveltejs/kit';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { join } from 'path';
import { randomUUID } from 'crypto';

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export async function POST({ request }) {
	try {
		const { filePath, text, x, y, fontSize, color, startTime, endTime } = await request.json();

		if (!filePath || !text) {
			return json({ error: 'Missing required parameters' }, { status: 400 });
		}

		const inputPath = join(process.cwd(), 'static', filePath.replace('/temp/', 'temp/'));
		const outputId = randomUUID();
		const outputPath = join(process.cwd(), 'static', 'temp', `${outputId}.mp4`);

		// Build drawtext filter
		let drawtextFilter = `drawtext=text='${text.replace(/'/g, "\\'")}':x=${x}%:y=${y}%:fontsize=${fontSize || 24}:fontcolor=${color || 'white'}`;
		
		if (startTime !== undefined && endTime !== undefined) {
			drawtextFilter += `:enable='between(t,${startTime},${endTime})'`;
		}

		return new Promise((resolve, reject) => {
			ffmpeg(inputPath)
				.videoFilters(drawtextFilter)
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
					reject(json({ error: 'Failed to add text overlay' }, { status: 500 }));
				})
				.run();
		});
	} catch (error) {
		console.error('Add text error:', error);
		return json({ error: 'Failed to add text overlay' }, { status: 500 });
	}
}

