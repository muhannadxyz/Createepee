import { json } from '@sveltejs/kit';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function POST({ request }) {
	try {
		const formData = await request.formData();
		const file = formData.get('video');
		
		if (!file || !(file instanceof File)) {
			return json({ error: 'No video file provided' }, { status: 400 });
		}

		// Create temp directory if it doesn't exist
		const tempDir = join(process.cwd(), 'static', 'temp');
		await mkdir(tempDir, { recursive: true });

		// Generate unique filename
		const fileId = randomUUID();
		const fileExt = file.name.split('.').pop();
		const fileName = `${fileId}.${fileExt}`;
		const filePath = join(tempDir, fileName);

		// Save file
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		await writeFile(filePath, buffer);

		return json({
			success: true,
			fileId,
			fileName,
			filePath: `/temp/${fileName}`,
			size: file.size,
			type: file.type
		});
	} catch (error) {
		console.error('Upload error:', error);
		return json({ error: 'Failed to upload video' }, { status: 500 });
	}
}

