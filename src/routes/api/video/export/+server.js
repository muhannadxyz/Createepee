import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET({ url }) {
	try {
		const filePath = url.searchParams.get('path');
		
		if (!filePath) {
			return new Response('Missing file path', { status: 400 });
		}

		const fullPath = join(process.cwd(), 'static', filePath.replace('/temp/', 'temp/'));
		
		try {
			const fileBuffer = await readFile(fullPath);
			
			return new Response(fileBuffer, {
				headers: {
					'Content-Type': 'video/mp4',
					'Content-Disposition': `attachment; filename="video.mp4"`,
					'Content-Length': fileBuffer.length.toString()
				}
			});
		} catch (error) {
			console.error('File read error:', error);
			return new Response('File not found', { status: 404 });
		}
	} catch (error) {
		console.error('Export error:', error);
		return new Response('Failed to export video', { status: 500 });
	}
}

