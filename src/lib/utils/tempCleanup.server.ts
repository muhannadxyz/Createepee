import fs from 'fs/promises';
import path from 'path';

const DEFAULT_MAX_AGE_HOURS = 6;

export const getTempDir = () => path.resolve('static', 'temp');

export const ensureTempDir = async () => {
	const dir = getTempDir();
	await fs.mkdir(dir, { recursive: true });
	return dir;
};

export const cleanupTempFiles = async (maxAgeHours = DEFAULT_MAX_AGE_HOURS) => {
	const dir = await ensureTempDir();
	let entries: string[] = [];
	try {
		entries = await fs.readdir(dir);
	} catch {
		return;
	}

	const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
	await Promise.all(
		entries.map(async (entry) => {
			const filePath = path.join(dir, entry);
			try {
				const stat = await fs.stat(filePath);
				if (stat.mtimeMs < cutoff) {
					await fs.unlink(filePath);
				}
			} catch {
				return;
			}
		})
	);
};
