export const exportCanvasImage = (
	canvas: any,
	format: 'png' | 'jpeg',
	quality = 0.92
) => {
	if (!canvas) return;
	const dataUrl = canvas.toDataURL({
		format,
		quality
	});
	const link = document.createElement('a');
	link.href = dataUrl;
	link.download = `export-${Date.now()}.${format === 'jpeg' ? 'jpg' : 'png'}`;
	link.click();
};
