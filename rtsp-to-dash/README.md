# RTSP to DASH Converter

This service converts RTSP video streams to DASH format for web playback. It provides both a React-based web interface and REST API endpoints for conversion and playback, with support for continuous streaming.

## Features

- Convert RTSP streams to DASH format using FFmpeg
- Modern React-based user interface with Material-UI
- Continuous live streaming support
- RESTful API for stream conversion
- Real-time stream playback
- Process management scripts for easy start/stop

## Prerequisites

- Node.js (v12 or higher)
- FFmpeg installed on the system
- npm or yarn package manager
- Modern web browser with DASH playback support
- Git for version control

## Installation

1. Clone the repository
2. Install all dependencies and build the client:
```bash
cd rtsp-to-dash
npm run setup
```

This will:
- Install server dependencies
- Install client dependencies
- Build the React application

## Usage

### Development Mode

To run both the server and client in development mode:
```bash
./start.sh dev
```

This will:
- Start the backend server on port 3000
- Start the React development server on port 3001
- Enable hot reloading for both client and server

### Production Mode

To run in production mode:
```bash
./start.sh
```

This will:
- Build the React application if not already built
- Serve the static React build from the backend
- Run only the backend server on port 3000

### Stopping the Server

To stop all components:
```bash
./stop.sh
```

This will stop:
- The Node.js server
- The React development server (if running)
- Any FFmpeg processes
- Clean up all resources

### Development Scripts

- `npm run dev`: Run both server and client in development mode
- `npm run server`: Run only the backend server
- `npm run client-start`: Run only the React development server
- `npm run client-build`: Build the React application
- `npm run setup`: Initial setup and build
- `npm test`: Run the test suite

### Publishing New Versions

To publish a new version:

1. Update CHANGELOG.md with your changes under a new version header:
```markdown
## [x.x.x] - YYYY-MM-DD

### Added
- New feature 1
- New feature 2

### Changed
- Change 1
- Change 2

### Fixed
- Fix 1
- Fix 2
```

2. Run the publish script:
```bash
./publish.sh
```

This will:
- Extract the latest version from CHANGELOG.md
- Create a git commit with the changelog entry
- Create and push a new tag
- Push changes to GitHub

## Web Interface

The web interface provides:
- Material-UI based modern design
- RTSP URL input for conversion
- DASH stream playback with dash.js
- Error notifications and status updates
- Responsive layout for all devices

### Development Interface

When running in development mode:
- React app: http://localhost:3001
- Backend API: http://localhost:3000

### Production Interface

When running in production mode:
- Everything runs on: http://localhost:3000

## API Endpoints

### Convert RTSP to DASH

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

### DASH Stream Access

The converted DASH stream is available at:
- MPD file: `http://localhost:3000/dash/stream.mpd`
- Segments: `http://localhost:3000/dash/chunk-stream*-*.m4s`

## Project Structure

```
rtsp-to-dash/
├── client/                 # React frontend
│   ├── public/            # Static files
│   ├── src/               # React source code
│   │   ├── components/    # React components
│   │   ├── App.js         # Main React component
│   │   └── index.js       # React entry point
│   └── package.json       # Client dependencies
├── server.js              # Express server
├── convert.sh             # FFmpeg conversion script
├── start.sh              # Server startup script
├── stop.sh               # Server shutdown script
├── publish.sh            # Version publishing script
├── test.js               # Test suite
├── CHANGELOG.md          # Version history
└── package.json          # Server dependencies
```

## Version Control

The project follows semantic versioning:
- MAJOR version for incompatible API changes
- MINOR version for added functionality in a backward compatible manner
- PATCH version for backward compatible bug fixes

All changes are documented in CHANGELOG.md and can be published using publish.sh.

## Technical Details

### Frontend Features

- Material-UI components
- dash.js video player integration
- Real-time status updates
- Error handling and notifications
- Responsive design

### Backend Features

- Express.js server
- CORS support
- Static file serving
- Process management
- Error handling

### Streaming Features

- Continuous segment generation
- Low-latency configuration
- Automatic process management
- Cleanup on server shutdown

## Troubleshooting

1. If the development server won't start:
   - Check if ports 3000 or 3001 are in use
   - Run ./stop.sh to clean up any existing processes
   - Check the logs for error messages

2. If the client build fails:
   - Clear the node_modules directory
   - Run npm run setup again
   - Check for JavaScript syntax errors

3. If conversion fails:
   - Verify the RTSP URL is accessible
   - Check FFmpeg is installed and in PATH
   - Check permissions on the dash/ directory
   - Check server logs for FFmpeg output

4. If playback fails:
   - Verify the MPD file exists
   - Check browser console for errors
   - Ensure the DASH segments are being generated
   - Try stopping and restarting the server

5. If publishing fails:
   - Ensure CHANGELOG.md is properly formatted
   - Check git repository status
   - Verify you have push access to the repository

## License

This project is licensed under the MIT License - see the LICENSE file for details.
