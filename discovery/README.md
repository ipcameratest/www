## Key Features:

1. **Automatic Network Scanning**: Scans your network range for active IP cameras
2. **Manufacturer Detection**: Identifies cameras from major manufacturers (Hikvision, Dahua, Axis, Foscam, TP-Link)
3. **RTSP Path Discovery**: Tests default RTSP paths and credentials for each manufacturer
4. **Web Streaming Interface**: View camera streams directly in the browser
5. **Real-time Updates**: WebSocket integration for live scanning updates

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
# Camera RTSP Discovery System

An automated system that scans your network for IP cameras, identifies them by manufacturer, discovers their RTSP URLs with default credentials, and provides a web interface to view live streams.

## Features

- **Automatic Network Scanning**: Scans your network range for active IP cameras
- **Manufacturer Detection**: Identifies cameras from major manufacturers (Hikvision, Dahua, Axis, Foscam, TP-Link)
- **RTSP Path Discovery**: Tests default RTSP paths and credentials for each manufacturer
- **Web Streaming Interface**: View camera streams directly in the browser using JSMpeg
- **Real-time Updates**: WebSocket integration for live scanning updates
- **Low Latency Streaming**: Optimized FFmpeg configuration for ~50ms latency

## Project Structure

```
camera-rtsp-discovery/
├── package.json                 # Dependencies and scripts
├── .env                        # Environment configuration
├── server.js                   # Main Express server
├── README.md                   # This file
├── lib/
│   ├── camera-discovery.js     # Camera scanning and identification
│   └── rtsp-streamer.js        # RTSP to WebSocket streaming
└── public/
    ├── index.html              # Main web interface
    ├── style.css               # Styling
    ├── app.js                  # Frontend JavaScript
    └── jsmpeg.min.js           # JSMpeg library (download separately)
```

## Installation

1. **Clone or download the project files**

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Download JSMpeg library**:
   ```bash
   # Download the official JSMpeg library to public folder
   curl -L https://github.com/phoboslab/jsmpeg/releases/latest/download/jsmpeg.min.js -o public/jsmpeg.min.js
   ```

4. **Install FFmpeg** (required for video streaming):
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt install ffmpeg
   
   # macOS
   brew install ffmpeg
   
   # Windows - download from https://ffmpeg.org/
   ```

5. **Configure environment** (edit `.env` file):
   ```env
   NETWORK_RANGE=192.168.1.0/24      # Your network range
   DEFAULT_USERNAME=admin
   DEFAULT_PASSWORD=admin
   RTSP_PORT_START=554
   RTSP_PORT_END=8554
   WEB_PORT=3000
   SCAN_TIMEOUT=5000
   MAX_CONCURRENT_SCANS=50
   ```

## Usage

1. **Start the server**:
   ```bash
   npm start
   ```

2. **Open web interface**:
   ```
   http://localhost:3000
   ```

3. **Scan for cameras**:
   - Click "Scan Network" to discover cameras
   - Wait for the scan to complete
   - Found cameras will appear as cards

4. **View camera streams**:
   - Click "View Stream" on any discovered camera
   - The live stream will open in a modal window
   - Click "Stop Stream" or close the modal to end streaming

## How It Works

### 1. Network Discovery
- Pings all IPs in your configured network range
- Identifies live hosts that respond to ping

### 2. Manufacturer Identification
- **HTTP Detection**: Checks common web interface ports (80, 8080, 8000)
- **Port Scanning**: Tests for open camera-specific ports (554, 37777, 88)
- **RTSP Probing**: Sends RTSP OPTIONS requests to identify services

### 3. RTSP Discovery
- Tests manufacturer-specific RTSP paths and credentials
- Validates RTSP connections before adding to discovered cameras
- Supports multiple credential combinations per manufacturer

### 4. Video Streaming
- Uses FFmpeg to convert RTSP streams to MPEG-TS format
- Creates individual WebSocket servers for each camera stream
- JSMpeg player in browser decodes and displays the video

## Supported Camera Manufacturers

| Manufacturer | Default Ports | Common Paths | Default Credentials |
|-------------|---------------|--------------|-------------------|
| **Hikvision** | 554, 8000, 8080 | `/Streaming/Channels/101` | admin/admin, admin/12345 |
| **Dahua** | 554, 37777 | `/cam/realmonitor?channel=1&subtype=0` | admin/admin, admin/123456 |
| **Axis** | 554 | `/axis-media/media.amp` | root/pass, admin/admin |
| **Foscam** | 554, 88 | `/videoMain`, `/videoSub` | admin/(blank), admin/admin |
| **TP-Link** | 554 | `/stream1`, `/stream2` | admin/admin |
| **Generic** | 554, 8554, 1935, 8080 | Various common paths | Multiple credential combinations |

## Configuration

### Environment Variables (.env)

- `NETWORK_RANGE`: CIDR notation for your network (e.g., 192.168.1.0/24)
- `WEB_PORT`: Port for the web interface (default: 3000)
- `SCAN_TIMEOUT`: Timeout for network operations in milliseconds
- `MAX_CONCURRENT_SCANS`: Number of concurrent IP scans

### Adding New Manufacturers

Edit `lib/camera-discovery.js` and add entries to the manufacturer database:

```javascript
'new_manufacturer': {
    defaultPorts: [554, 8080],
    rtspPaths: ['/your/rtsp/path'],
    defaultCredentials: [
        { username: 'admin', password: 'password' }
    ],
    httpPorts: [80, 8080],
    identification: ['manufacturer_string']
}
```

## Troubleshooting

### No Cameras Found
1. **Check network range**: Ensure `.env` has correct network CIDR
2. **Verify camera accessibility**: Manually test camera web interfaces
3. **Check credentials**: Cameras may not use default passwords
4. **Firewall issues**: Ensure no firewall blocking camera ports

### Streaming Issues
1. **FFmpeg not installed**: Install FFmpeg on your system
2. **RTSP credentials**: Verify username/password are correct
3. **Network connectivity**: Ensure stable connection to cameras
4. **Browser compatibility**: Use Chrome, Firefox, Safari, or Edge

### Performance Issues
1. **Reduce concurrent scans**: Lower `MAX_CONCURRENT_SCANS` in `.env`
2. **Increase timeouts**: Raise `SCAN_TIMEOUT` for slow networks
3. **Limit camera resolution**: Cameras may need lower resolution settings

## Security Considerations

- **Default Credentials**: This system only discovers cameras using default credentials
- **Network Security**: Ensure cameras are on isolated network segments
- **Password Changes**: Change default passwords on all discovered cameras
- **Access Control**: Implement proper authentication for production use

## API Endpoints

- `GET /api/scan` - Trigger network scan for cameras
- `GET /api/cameras` - Get list of discovered cameras
- `POST /api/stream/:id` - Start streaming for specific camera
- `DELETE /api/stream/:id` - Stop streaming for specific camera

## License

This project is provided as-is for educational and testing purposes. 
Ensure compliance with local laws and camera manufacturer terms of service when using this system.