import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export const runFfmpeg = (command: ffmpeg.FfmpegCommand) =>
	new Promise<void>((resolve, reject) => {
		command.on('end', () => resolve());
		command.on('error', (error) => reject(error));
		command.run();
	});

export default ffmpeg;
