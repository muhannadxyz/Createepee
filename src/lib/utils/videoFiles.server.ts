import fs from 'fs/promises';
import path from 'path';
import { getTempDir, ensureTempDir } from './tempCleanup.server';

export const writeTempFile = async (id: string, extension: string, data: Buffer) => {
	const dir = await ensureTempDir();
	const safeExt = extension.startsWith('.') ? extension : `.${extension}`;
	const filename = `${id}${safeExt}`;
	const filePath = path.join(dir, filename);
	await fs.writeFile(filePath, data);
	return { filename, filePath, url: `/temp/${filename}` };
};

export const resolveTempFile = async (id: string) => {
	const dir = await ensureTempDir();
	const entries = await fs.readdir(dir);
	const match = entries.find((entry) => entry.startsWith(id));
	if (!match) return null;
	return { filename: match, filePath: path.join(dir, match), url: `/temp/${match}` };
};

export const resolveExactTempFile = async (filename: string) => {
	const dir = getTempDir();
	const filePath = path.join(dir, filename);
	try {
		await fs.access(filePath);
		return { filename, filePath, url: `/temp/${filename}` };
	} catch {
		return null;
	}
};
