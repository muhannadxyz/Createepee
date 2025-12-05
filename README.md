# Editor Hub

A comprehensive web-based editing suite built with SvelteKit. Edit images, videos, documents, and convert files directly in your browser - no signup required.

## 🎨 Features

### Image Editor
- **Canvas-based editing** using Fabric.js
- **Tools**: Select, Text, Rectangle, Circle, Ellipse, Line, Free Draw
- **Layer management**: Add, reorder, and delete layers
- **Filters**: Brightness, Contrast, Saturation, Blur with real-time preview
- **Color controls**: Stroke, Fill, and Text color pickers
- **Export**: Download as PNG or JPG

### Video Editor
- **Video upload and preview** with custom timeline
- **Trim**: Cut videos by setting start and end times
- **Merge**: Combine multiple video clips
- **Text overlay**: Add text with customizable position, size, and color
- **Audio**: Add background music or replace audio track
- **Export**: Download processed videos as MP4

### Document Tools
- Coming soon...

### File Converters
- Coming soon...

## Features

### Image Editor
- **Canvas-based editing** using Fabric.js
- **Tools**: Text, Rectangle, Circle, Line drawing
- **Layer management**: Add, reorder, and delete layers
- **Filters**: Brightness, Contrast, Saturation, Blur with real-time preview
- **Export**: Download as PNG or JPG

### Video Editor
- **Video upload and preview** with custom timeline
- **Trim**: Cut videos by setting start and end times
- **Merge**: Combine multiple video clips
- **Text overlay**: Add text with customizable position, size, and color
- **Audio**: Add background music or replace audio track
- **Export**: Download processed videos as MP4

## Tech Stack

- **Frontend**: SvelteKit, Svelte
- **Image Editing**: Fabric.js
- **Video Processing**: FFmpeg (via fluent-ffmpeg)
- **Backend**: SvelteKit API routes

## Getting Started

### Prerequisites

- Node.js 18+ (Note: Some features may require Node 20+)
- FFmpeg installed on your system (for video processing)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── lib/
│   ├── components/      # Svelte components
│   ├── stores/          # Svelte stores for state management
│   └── utils/           # Utility functions
└── routes/
    ├── api/video/       # Video processing API endpoints
    ├── +layout.svelte   # Root layout
    └── +page.svelte     # Main page
```

## Usage

### Image Editing
1. Click "Image Editor" in the sidebar
2. Upload an image
3. Use tools to add text, shapes, or apply filters
4. Manage layers in the Layers panel
5. Click "Export" to download your image

### Video Editing
1. Click "Video Editor" in the sidebar
2. Upload a video file
3. Use tools to trim, merge, add text, or add audio
4. Preview your edits
5. Click "Export" to download the processed video

## API Endpoints

- `POST /api/video/upload` - Upload video file
- `POST /api/video/trim` - Trim video
- `POST /api/video/merge` - Merge videos
- `POST /api/video/add-text` - Add text overlay
- `POST /api/video/add-audio` - Add audio track
- `GET /api/video/export` - Download processed video

## Notes

- All processing happens server-side for videos
- Image editing is fully client-side
- Temporary files are stored in `static/temp/`
- No authentication required - all operations are anonymous

## License

MIT
