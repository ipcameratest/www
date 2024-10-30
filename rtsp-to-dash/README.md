# RTSP to DASH Converter

This service converts RTSP video streams to DASH format for web playback. It provides both a web interface and REST API endpoints for conversion and playback, with support for continuous streaming.

## Features

- Convert RTSP streams to DASH format using FFmpeg
- Continuous live streaming support
- Web-based player interface using dash.js
- RESTful API for stream conversion
- Real-time stream playback
- Process management scripts for easy start/stop

## Prerequisites

- Node.js (v12 or higher)
- FFmpeg installed on the system
- Express.js
- Modern web browser with DASH playback support

## Installation

1. Clone the repository
2. Install dependencies:
```bash
cd rtsp-to-dash
npm install
```

## Usage

### Starting the Server

You can start the server using either:
```bash
npm start
# or
./start.sh
```

The server will start on http://localhost:3000

### Stopping the Server

To stop the server and clean up all related processes:
```bash
npm stop
# or
./stop.sh
```

This will:
- Stop the Node.js server on port 3000
- Kill any running FFmpeg processes
- Clean up resources

### Web Interface

Access the web interface at http://localhost:3000

1. Enter an RTSP URL in the input field
2. Click "Convert" to start the conversion
3. Once conversion starts, the DASH stream will be available
4. Use the player controls to watch the stream

### API Endpoints

#### Convert RTSP to DASH

```http
POST /convert
Content-Type: application/json

{
    "rtspUrl": "rtsp://example.com/stream"
}
```

**Parameters:**
- `rtspUrl` (required): Valid RTSP URL starting with "rtsp://"

**Response:**
- Success (200):
```json
{
    "message": "Conversion started"
}
```
- Error (400):
```json
{
    "error": "Invalid RTSP URL format"
}
```
- Error (500):
```json
{
    "error": "Conversion failed",
    "details": "error details..."
}
```

### DASH Stream Access

The converted DASH stream is available at:
- MPD file: `http://localhost:3000/dash/stream.mpd`
- Segments: `http://localhost:3000/dash/chunk-stream*-*.m4s`

## File Structure

```
rtsp-to-dash/
├── server.js          # Express server implementation
├── convert.sh         # FFmpeg conversion script
├── start.sh          # Server startup script
├── stop.sh           # Server shutdown script
├── test.js           # Test suite
├── public/           # Static web files
│   └── index.html    # Web interface
└── dash/             # DASH output directory
    ├── stream.mpd    # DASH manifest
    └── *.m4s         # Media segments
```

## Technical Details

### Conversion Process

The conversion uses FFmpeg with the following settings:
- Video codec: H.264
- Video bitrate: 800k
- Audio codec: AAC
- Audio bitrate: 128k
- Output format: DASH
- Continuous streaming enabled
- Window size: 5 segments
- Extra window size: 10 segments

### Live Streaming Features

- Continuous segment generation
- Low-latency configuration
- Automatic process management
- Cleanup on server shutdown

### Error Handling

The server includes comprehensive error handling for:
- Invalid RTSP URLs
- FFmpeg conversion failures
- File system operations
- Network issues
- Process management

## Testing

Run the test suite:
```bash
npm test
```

The tests verify:
- Server availability
- API functionality
- File generation
- Stream accessibility
- Process management
- Error handling

## Troubleshooting

1. If conversion fails:
   - Verify the RTSP URL is accessible
   - Check FFmpeg is installed and in PATH
   - Check permissions on the dash/ directory
   - Check server logs for FFmpeg output

2. If playback fails:
   - Verify the MPD file exists
   - Check browser console for errors
   - Ensure the DASH segments are being generated
   - Try stopping and restarting the server

3. If server won't stop:
   - Use the stop.sh script to force cleanup
   - Check for remaining processes on port 3000
   - Manually kill any remaining FFmpeg processes

## License

This project is licensed under the MIT License - see the LICENSE file for details.
