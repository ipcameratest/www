# Changelog

All notable changes to this project will be documented in this file.

## [3.0.0] - 2024-10-30

### Added
- React-based web interface
- Material-UI components and styling
- Development and production modes
- CORS support for API
- Improved process management
- Enhanced development workflow

### Changed
- Complete UI overhaul with React
- Updated server to serve React build
- Enhanced start/stop scripts
- Improved documentation
- Better error handling and notifications

### Technical Changes
- Added React client application
- Integrated Material-UI
- Updated dash.js player configuration
- Added development server support
- Enhanced build process

## [2.0.0] - 2024-10-30

### Added
- Continuous streaming support
- Low-latency DASH configuration
- Process management scripts (start.sh and stop.sh)
- Comprehensive test suite
- Error handling for FFmpeg processes
- Automatic cleanup of old processes

### Changed
- Updated FFmpeg parameters for better streaming
- Optimized dash.js player configuration
- Improved buffer management
- Enhanced error handling in server
- Better process management

### Fixed
- 10-second stream limitation
- Player configuration errors
- Process cleanup issues
- Static file serving
- Stream initialization delays

### Technical Changes
- Added -preset ultrafast and -tune zerolatency
- Implemented low-latency DASH (-ldash 1)
- Optimized segment duration (2s)
- Improved window and buffer settings
- Enhanced process management with proper cleanup
- Updated player settings for better compatibility

## [1.0.0] - Initial Release

### Features
- Basic RTSP to DASH conversion
- Web interface for stream management
- REST API for conversion
- Basic playback capabilities
