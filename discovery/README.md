## Key Features:

1. **Automatic Network Scanning**: Scans your network range for active IP cameras
2. **Manufacturer Detection**: Identifies cameras from major manufacturers (Hikvision, Dahua, Axis, Foscam, TP-Link)
3. **RTSP Path Discovery**: Tests default RTSP paths and credentials for each manufacturer
4. **Web Streaming Interface**: View camera streams directly in the browser
5. **Real-time Updates**: WebSocket integration for live scanning updates

## File Structure:

- `server.js` - Main Express server with WebSocket support
- `lib/camera-discovery.js` - Core camera scanning and identification logic
- `lib/rtsp-streamer.js` - RTSP to WebSocket streaming handler
- `public/` - Web interface files (HTML, CSS, JavaScript)
- `.env` - Configuration file
- `package.json` - Node.js dependencies

## Setup Instructions:

1. **Install Dependencies**:
```bash
npm install
```

2. **Download JSMpeg** (for browser video streaming):
+ [phoboslab/jsmpeg: MPEG1 Video Decoder in JavaScript](https://github.com/phoboslab/jsmpeg/tree/master)
```bash
# Download jsmpeg.min.js to public/ folder
wget https://raw.githubusercontent.com/phoboslab/jsmpeg/refs/heads/master/jsmpeg.min.js -O public/jsmpeg.min.js
```

3. **Configure Environment** (edit `.env`):
   - Set your network range (e.g., `192.168.1.0/24`)
   - Adjust default credentials if needed
   - Configure scan settings

4. **Install FFmpeg** (required for streaming):
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Windows - download from https://ffmpeg.org/
```

5. **Run the System**:
```bash
npm start
```

6. **Access Web Interface**:
   - Open `http://localhost:3030`
   - Click "Scan Network" to discover cameras
   - Click "View Stream" on any discovered camera

## How It Works:

1. **Network Discovery**: Pings all IPs in your network range
2. **Manufacturer Identification**: Checks HTTP responses and open ports
3. **RTSP Testing**: Tests common RTSP paths with default credentials
4. **Stream Conversion**: Converts RTSP to WebSocket streams using FFmpeg
5. **Web Display**: Shows live video feeds in the browser

## Supported Manufacturers:

- **Hikvision**: Multiple RTSP paths and credential combinations
- **Dahua**: Common paths for different camera models  
- **Axis**: Standard RTSP endpoints
- **Foscam**: Various stream quality options
- **TP-Link/Tapo**: Modern consumer cameras

The system automatically handles different authentication methods, ports, and RTSP paths for each manufacturer. You can extend the manufacturer database in `camera-discovery.js` to add support for additional camera brands.

**Security Note**: The system only discovers cameras using default credentials. For production use, ensure your cameras have secure passwords and are properly configured.