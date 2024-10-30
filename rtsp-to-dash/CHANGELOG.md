# Changelog

All notable changes to this project will be documented in this file.

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
