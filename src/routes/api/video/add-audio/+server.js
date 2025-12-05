import { json } from '@sveltejs/kit';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { join } from 'path';
import { randomUUID } from 'crypto';

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export async function POST({ request }) {
	try {
		const { videoPath, audioPath, mixMode = 'mix' } = await request.json();

		if (!videoPath || !audioPath) {
			return json({ error: 'Missing required parameters' }, { status: 400 });
		}

		const videoInputPath = join(process.cwd(), 'static', videoPath.replace('/temp/', 'temp/'));
		const audioInputPath = join(process.cwd(), 'static', audioPath.replace('/temp/', 'temp/'));
		const outputId = randomUUID();
		const outputPath = join(process.cwd(), 'static', 'temp', `${outputId}.mp4`);

		return new Promise((resolve, reject) => {
			const command = ffmpeg(videoInputPath)
				.input(audioInputPath);

			if (mixMode === 'replace') {
				command.outputOptions(['-c:v', 'copy', '-c:a', 'aac', '-map', '0:v:0', '-map', '1:a:0']);
			} else {
				// Mix audio
				command.complexFilter([
					'[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=2[a]'
				])
				.outputOptions(['-map', '0:v:0', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac']);
			}

			command
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
					reject(json({ error: 'Failed to add audio' }, { status: 500 }));
				})
				.run();
		});
	} catch (error) {
		console.error('Add audio error:', error);
		return json({ error: 'Failed to add audio' }, { status: 500 });
	}
}

