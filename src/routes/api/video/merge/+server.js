import { json } from '@sveltejs/kit';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { writeFile, unlink } from 'fs/promises';

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export async function POST({ request }) {
	try {
		const { filePaths } = await request.json();

		if (!filePaths || !Array.isArray(filePaths) || filePaths.length < 2) {
			return json({ error: 'At least 2 video files required' }, { status: 400 });
		}

		const tempDir = join(process.cwd(), 'static', 'temp');
		const concatFile = join(tempDir, `concat_${randomUUID()}.txt`);
		const outputId = randomUUID();
		const outputPath = join(tempDir, `${outputId}.mp4`);

		// Create concat file
		const concatContent = filePaths
			.map(path => {
				const fullPath = join(process.cwd(), 'static', path.replace('/temp/', 'temp/'));
				return `file '${fullPath}'`;
			})
			.join('\n');

		await writeFile(concatFile, concatContent);

		return new Promise((resolve, reject) => {
			ffmpeg()
				.input(concatFile)
				.inputOptions(['-f', 'concat', '-safe', '0'])
				.outputOptions(['-c', 'copy'])
				.output(outputPath)
				.on('end', async () => {
					// Clean up concat file
					try {
						await unlink(concatFile);
					} catch (e) {
						console.error('Failed to delete concat file:', e);
					}
					resolve(json({
						success: true,
						fileId: outputId,
						filePath: `/temp/${outputId}.mp4`
					}));
				})
				.on('error', async (err) => {
					console.error('FFmpeg error:', err);
					try {
						await unlink(concatFile);
					} catch (e) {
						// Ignore
					}
					reject(json({ error: 'Failed to merge videos' }, { status: 500 }));
				})
				.run();
		});
	} catch (error) {
		console.error('Merge error:', error);
		return json({ error: 'Failed to merge videos' }, { status: 500 });
	}
}

