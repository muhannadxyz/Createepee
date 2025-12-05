export async function uploadVideo(file) {
	const formData = new FormData();
	formData.append('video', file);

	const response = await fetch('/api/video/upload', {
		method: 'POST',
		body: formData
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to upload video');
	}

	return await response.json();
}

export async function trimVideo(filePath, startTime, endTime) {
	const response = await fetch('/api/video/trim', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ filePath, startTime, endTime })
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to trim video');
	}

	return await response.json();
}

export async function mergeVideos(filePaths) {
	const response = await fetch('/api/video/merge', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ filePaths })
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to merge videos');
	}

	return await response.json();
}

export async function addTextToVideo(filePath, text, x, y, fontSize, color, startTime, endTime) {
	const response = await fetch('/api/video/add-text', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			filePath,
			text,
			x,
			y,
			fontSize,
			color,
			startTime,
			endTime
		})
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to add text');
	}

	return await response.json();
}

export async function addAudioToVideo(videoPath, audioPath, mixMode = 'mix') {
	const response = await fetch('/api/video/add-audio', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ videoPath, audioPath, mixMode })
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to add audio');
	}

	return await response.json();
}

export function downloadVideo(filePath) {
	const url = `/api/video/export?path=${encodeURIComponent(filePath)}`;
	const link = document.createElement('a');
	link.href = url;
	link.download = 'video.mp4';
	link.click();
}

