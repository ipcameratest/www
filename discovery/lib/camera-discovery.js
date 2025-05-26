const ping = require('ping');
const net = require('net');
const axios = require('axios');
const cheerio = require('cheerio');

class CameraDiscovery {
    constructor() {
        this.discoveredCameras = [];
        this.manufacturerDatabase = this.loadManufacturerDatabase();
    }

    loadManufacturerDatabase() {
        return {
            'hikvision': {
                defaultPorts: [554, 8000],
                rtspPaths: [
                    '/Streaming/Channels/101',
                    '/Streaming/Channels/1/Picture',
                    '/h264/ch1/main/av_stream',
                    '/h264/ch1/sub/av_stream',
                    '/Streaming/Channels/1/mediastream',
                    '/cam/realmonitor?channel=1&subtype=0'
                ],
                defaultCredentials: [
                    { username: 'admin', password: 'admin' },
                    { username: 'admin', password: '12345' },
                    { username: 'admin', password: '' },
                    { username: 'admin', password: 'password' },
                    { username: 'admin', password: '123456' }
                ]
            },
            'dahua': {
                defaultPorts: [554, 37777],
                rtspPaths: [
                    '/cam/realmonitor?channel=1&subtype=0',
                    '/live/ch1',
                    '/cam/realmonitor?channel=1&subtype=1',
                    '/live/ch00_0',
                    '/live/main',
                    '/live/av0_0',
                    '/live/av0_1'
                ],
                defaultCredentials: [
                    { username: 'admin', password: 'admin' },
                    { username: 'admin', password: '123456' },
                    { username: 'admin', password: '' },
                    { username: 'admin', password: 'password' }
                ]
            },
            'axis': {
                defaultPorts: [554],
                rtspPaths: [
                    '/axis-media/media.amp',
                    '/mpeg4/media.amp',
                    '/mjpg/video.mjpg',
                    '/axis-media/media.amp?videocodec=h264',
                    '/axis-media/media.amp?camera=1'
                ],
                defaultCredentials: [
                    { username: 'root', password: 'pass' },
                    { username: 'admin', password: 'admin' },
                    { username: 'root', password: '' },
                    { username: 'admin', password: '' }
                ]
            },
            'foscam': {
                defaultPorts: [554, 88],
                rtspPaths: [
                    '/videoMain',
                    '/videoSub',
                    '/11',
                    '/h264Preview_01_main',
                    '/h264Preview_01_sub'
                ],
                defaultCredentials: [
                    { username: 'admin', password: '' },
                    { username: 'admin', password: 'admin' },
                    { username: 'admin', password: 'password' }
                ]
            },
            'tp-link': {
                defaultPorts: [554],
                rtspPaths: [
                    '/stream1',
                    '/stream2',
                    '/h264Preview_01_main',
                    '/live/ch00_0'
                ],
                defaultCredentials: [
                    { username: 'admin', password: 'admin' },
                    { username: 'admin', password: '' },
                    { username: 'admin', password: 'password' }
                ]
            },
            'uniview': {
                defaultPorts: [554],
                rtspPaths: [
                    '/media/video1',
                    '/stream1',
                    '/stream2',
                    '/live/ch00_0'
                ],
                defaultCredentials: [
                    { username: 'admin', password: '123456' },
                    { username: 'admin', password: 'admin' },
                    { username: 'admin', password: '' }
                ]
            },
            'reolink': {
                defaultPorts: [554],
                rtspPaths: [
                    '/h264Preview_01_main',
                    '/h264Preview_01_sub',
                    '/preview_01_main.sdp',
                    '/preview_01_sub.sdp'
                ],
                defaultCredentials: [
                    { username: 'admin', password: 'admin' },
                    { username: 'admin', password: '' }
                ]
            },
            'vivotek': {
                defaultPorts: [554],
                rtspPaths: [
                    '/live.sdp',
                    '/live1.sdp',
                    '/live2.sdp'
                ],
                defaultCredentials: [
                    { username: 'root', password: 'admin' },
                    { username: 'admin', password: 'admin' }
                ]
            },
            'generic': {
                defaultPorts: [554, 8554, 1935, 8080],
                rtspPaths: [
                    '/live',
                    '/stream',
                    '/video',
                    '/cam',
                    '/live.sdp',
                    '/stream.sdp',
                    '/video.sdp',
                    '/h264',
                    '/mjpeg',
                    '/mpeg4',
                    '/live/ch1',
                    '/live/main',
                    '/live/sub',
                    '/stream1',
                    '/stream2',
                    '/channel1',
                    '/channel01',
                    '/media/video1',
                    '/av0_0',
                    '/av0_1',
                    '/cam/realmonitor?channel=1&subtype=0',
                    '/h264Preview_01_main',
                    '/videoMain',
                    '/axis-media/media.amp'
                ],
                defaultCredentials: [
                    { username: 'admin', password: 'admin' },
                    { username: 'admin', password: '' },
                    { username: 'admin', password: 'password' },
                    { username: 'admin', password: '123456' },
                    { username: 'admin', password: '12345' },
                    { username: 'root', password: 'admin' },
                    { username: 'root', password: 'pass' },
                    { username: 'root', password: '' },
                    { username: 'user', password: 'user' },
                    { username: '', password: '' }
                ]
            }
        };
    }

    async scanNetwork() {
        console.log('Starting network scan...');
        this.discoveredCameras = [];

        const networkRange = process.env.NETWORK_RANGE || '192.168.1.0/24';
        const ips = this.generateIPRange(networkRange);

        console.log(`Scanning ${ips.length} IP addresses...`);

        // Step 1: Find all alive IPs
        console.log('Step 1: Finding alive hosts...');
        const aliveIPs = await this.findAliveHosts(ips);
        console.log(`Found ${aliveIPs.length} alive hosts: ${aliveIPs.join(', ')}`);

        // Step 2: Check for camera web interfaces
        console.log('Step 2: Checking for camera web interfaces...');
        const potentialCameras = await this.identifyCameraHosts(aliveIPs);
        console.log(`Found ${potentialCameras.length} potential cameras`);

        // Step 3: Try RTSP discovery for identified cameras
        console.log('Step 3: Testing RTSP connections...');
        for (const cameraInfo of potentialCameras) {
            const camera = await this.discoverRTSPForCamera(cameraInfo);
            if (camera) {
                this.discoveredCameras.push(camera);
                console.log(`✓ RTSP discovered: ${camera.name} at ${camera.ip}`);
            }
        }

        console.log(`Scan complete. Found ${this.discoveredCameras.length} working cameras.`);
        return this.discoveredCameras;
    }

    generateIPRange(cidr) {
        const [network, prefixLength] = cidr.split('/');
        const [a, b, c, d] = network.split('.').map(Number);
        const hostBits = 32 - parseInt(prefixLength);
        const hostCount = Math.pow(2, hostBits) - 2; // Exclude network and broadcast

        const ips = [];
        for (let i = 1; i <= hostCount; i++) {
            const ip = `${a}.${b}.${c}.${d + i}`;
            ips.push(ip);
        }
        return ips;
    }

    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    async findAliveHosts(ips) {
        const concurrency = parseInt(process.env.MAX_CONCURRENT_SCANS) || 50;
        const chunks = this.chunkArray(ips, concurrency);
        const aliveHosts = [];

        for (const chunk of chunks) {
            const results = await Promise.all(
                chunk.map(async (ip) => {
                    try {
                        const pingResult = await ping.promise.probe(ip, {
                            timeout: parseInt(process.env.SCAN_TIMEOUT) || 5000
                        });
                        return pingResult.alive ? ip : null;
                    } catch (error) {
                        return null;
                    }
                })
            );

            aliveHosts.push(...results.filter(ip => ip !== null));
        }

        return aliveHosts;
    }

    async identifyCameraHosts(ips) {
        const potentialCameras = [];

        for (const ip of ips) {
            console.log(`Checking web interfaces on ${ip}...`);

            // Check common web ports for camera interfaces
            const webPorts = [80, 8080, 8000, 443, 88, 37777, 8081, 8888];
            let cameraFound = false;
            let detectedManufacturer = 'generic';
            let workingPort = null;

            for (const port of webPorts) {
                if (await this.isPortOpen(ip, port)) {
                    console.log(`  ✓ Port ${port} open on ${ip}`);

                    const webCheck = await this.checkWebInterface(ip, port);
                    if (webCheck.isCamera) {
                        console.log(`  ✓ Camera interface found on ${ip}:${port} (${webCheck.manufacturer || 'generic'})`);
                        cameraFound = true;
                        detectedManufacturer = webCheck.manufacturer || 'generic';
                        workingPort = port;
                        break;
                    }
                }
            }

            // If no web interface found, check for RTSP port as backup
            if (!cameraFound && await this.isPortOpen(ip, 554)) {
                console.log(`  ✓ RTSP port 554 open on ${ip} - assuming camera`);
                cameraFound = true;
            }

            if (cameraFound) {
                potentialCameras.push({
                    ip: ip,
                    manufacturer: detectedManufacturer,
                    webPort: workingPort
                });
            }
        }

        return potentialCameras;
    }

        // Enhanced checkWebInterface with better detection and error handling
    async checkWebInterface(ip, port) {
        try {
            const protocols = port === 443 ? ['https'] : ['http', 'https'];
            const httpTimeout = 5000; // 5 seconds timeout

            for (const protocol of protocols) {
                try {
                    const url = `${protocol}://${ip}:${port}`;
                    console.log(`Checking web interface at ${url}...`);

                    const response = await axios.get(url, {
                        timeout: httpTimeout,
                        validateStatus: () => true, // Accept all status codes
                        maxRedirects: 2,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.5',
                            'Connection': 'keep-alive',
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache'
                        }
                    });

                    const status = response.status;
                    console.log(`HTTP ${status} from ${url}`);

                    // Check for common camera response patterns
                    if ([200, 401, 403, 404].includes(status)) {
                        const html = (response.data || '').toString().toLowerCase();
                        const headers = JSON.stringify(response.headers).toLowerCase();
                        const combined = html + ' ' + headers;

                        // Expanded list of camera indicators
                        const cameraIndicators = [
                            // General camera terms
                            'camera', 'ipcam', 'webcam', 'surveillance', 'security',
                            'dvr', 'nvr', 'cctv', 'video server', 'network video',
                            'live view', 'video monitor', 'streaming', 'video feed',

                            // Authentication related
                            'login', 'password', 'username', 'sign in', 'log in',
                            'admin', 'administrator', 'user login', 'device login',

                            // Manufacturer specific
                            'hikvision', 'dahua', 'axis', 'foscam', 'tp-link',
                            'uniview', 'reolink', 'vivotek', 'mobotix', 'bosch',
                            'pelco', 'panasonic', 'sony', 'samsung', 'hanwha'
                        ];

                        const hasCameraIndicators = cameraIndicators.some(indicator =>
                            combined.includes(indicator.toLowerCase())
                        );

                        if (hasCameraIndicators) {
                            const manufacturer = this.identifyManufacturerFromResponse(combined);
                            console.log(`Detected ${manufacturer} camera at ${url}`);
                            return {
                                isCamera: true,
                                manufacturer: manufacturer,
                                response: {
                                    status: status,
                                    headers: response.headers,
                                    data: response.data?.substring(0, 1000) // First 1000 chars
                                }
                            };
                        }
                    }
                } catch (error) {
                    if (!axios.isCancel(error)) {
                        console.error(`Error checking ${protocol}://${ip}:${port}:`, error.message);
                    }
                    // Continue to next protocol
                }
            }
        } catch (error) {
            console.error(`Unexpected error in checkWebInterface for ${ip}:${port}:`, error.message);
        }

        return { isCamera: false };
    }

    identifyManufacturerFromResponse(content) {
        const manufacturers = [
            {
                name: 'hikvision',
                keywords: [
                    'hikvision', 'hik-connect', 'hik-connect.net',
                    'ds-', 'ipc-', 'hikcentral', 'ivms-'
                ]
            },
            {
                name: 'dahua',
                keywords: [
                    'dahua', 'dh-', 'ipc-hdw', 'ipc-hfw', 'nvr4', 'dhi-',
                    'dahua technology', 'dahua cctv', 'dmss'
                ]
            },
            {
                name: 'axis',
                keywords: [
                    'axis', 'vapix', 'axis communications', 'axis camera',
                    'axis companion', 'axis network camera'
                ]
            },
            {
                name: 'foscam',
                keywords: [
                    'foscam', 'fi8', 'fi9', 'foscam cgi', 'foscam inc',
                    'foscam camera', 'foscam web service'
                ]
            },
            {
                name: 'tp-link',
                keywords: [
                    'tp-link', 'tapo', 'kasa', 'tp link', 'tapoc200',
                    'tapoc210', 'tapoc310', 'kc310s', 'kc810'
                ]
            },
            {
                name: 'uniview',
                keywords: [
                    'uniview', 'ipc', 'nvr', 'ehd', 'unv-', 'unv ',
                    'uniview technology', 'uniview cctv'
                ]
            },
            {
                name: 'reolink',
                keywords: [
                    'reolink', 'rlc-', 'rln', 'reolink camera',
                    'reolink nvr', 'reolink web'
                ]
            },
            {
                name: 'vivotek',
                keywords: [
                    'vivotek', 'vv', 'va-', 'vb-', 'vc-', 'vd-', 've-',
                    'vivotek inc', 'vivotek camera'
                ]
            },
            {
                name: 'mobotix',
                keywords: [
                    'mobotix', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7',
                    'mobotix ag', 'mobotix camera'
                ]
            },
            {
                name: 'bosch',
                keywords: [
                    'bosch', 'flexidome', 'dinion', 'autodome', 'bosch security',
                    'bosch camera', 'bosch video'
                ]
            },
            {
                name: 'pelco',
                keywords: [
                    'pelco', 'sarix', 'spectra', 'ultim', 'pelco by schneider',
                    'pelco video', 'pelco camera'
                ]
            },
            {
                name: 'panasonic',
                keywords: [
                    'panasonic', 'i-pro', 'wv-', 'wv ', 'panasonic network',
                    'panasonic camera', 'panasonic security'
                ]
            },
            {
                name: 'sony',
                keywords: [
                    'sony', 'snc-', 'sony corporation', 'sony camera',
                    'sony network camera', 'sony security'
                ]
            },
            {
                name: 'samsung',
                keywords: [
                    'samsung', 'hanwha', 'wisenet', 'snp-', 'snv-', 'sno-',
                    'samsung techwin', 'samsung security'
                ]
            }
        ];

        const contentLower = content.toLowerCase();
        for (const manufacturer of manufacturers) {
            for (const keyword of manufacturer.keywords) {
                if (contentLower.includes(keyword.toLowerCase())) {
                    return manufacturer.name;
                }
            }
        }

        // Check for common camera paths if no manufacturer found
        const commonCameraPaths = [
            '/view/viewer.shtml', // Axis
            '/view/view.shtml',  // Axis
            '/doc/page/login.asp', // Hikvision
            '/doc/page/login.asp#', // Hikvision
            '/login.asp', // Many cameras
            '/login.htm', // Many cameras
            '/web/admin/index.html', // Many cameras
            '/web/index.html', // Many cameras
            '/cgi-bin/viewer/video.jpg' // Many cameras
        ];

        if (commonCameraPaths.some(path => contentLower.includes(path))) {
            return 'generic';
        }

        return 'unknown';
    }

    async tryPortIdentification(ip) {
        // Test for open RTSP and camera-specific ports
        const commonCameraPorts = [554, 8000, 8080, 37777, 88, 1935, 8554];

        for (const port of commonCameraPorts) {
            if (await this.isPortOpen(ip, port)) {
                console.log(`Found open port ${port} on ${ip}`);

                // Try to identify by port patterns
                if (port === 37777) return 'dahua';
                if (port === 88) return 'foscam';
                if (port === 8000) return 'hikvision';

                // For standard RTSP port, try to get more info
                if (port === 554) {
                    const rtspInfo = await this.probeRTSPPort(ip, port);
                    if (rtspInfo) return rtspInfo;
                }

                return 'generic'; // Found camera port but unknown manufacturer
            }
        }
        return null;
    }

    async tryGenericCameraDetection(ip) {
        // Last resort: try common camera ports and paths
        const testPorts = [554, 8080, 80, 8000];

        for (const port of testPorts) {
            if (await this.isPortOpen(ip, port)) {
                console.log(`Generic detection: Found open port ${port} on ${ip}`);
                return 'generic';
            }
        }

        return null;
    }

    async probeRTSPPort(ip, port) {
        return new Promise((resolve) => {
            const socket = new net.Socket();

            socket.setTimeout(3000);
            socket.on('connect', () => {
                // Send RTSP OPTIONS request
                socket.write('OPTIONS * RTSP/1.0\r\nCSeq: 1\r\nUser-Agent: CameraDiscovery\r\n\r\n');
            });

            socket.on('data', (data) => {
                const response = data.toString().toLowerCase();
                socket.destroy();

                // Try to identify manufacturer from RTSP response
                if (response.includes('hikvision')) resolve('hikvision');
                else if (response.includes('dahua')) resolve('dahua');
                else if (response.includes('axis')) resolve('axis');
                else if (response.includes('foscam')) resolve('foscam');
                else if (response.includes('rtsp/1.0 200')) resolve('generic');
                else resolve(null);
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve(null);
            });

            socket.on('error', () => {
                resolve(null);
            });

            socket.connect(port, ip);
        });
    }

    async isPortOpen(ip, port) {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            const timeout = 3000;

            socket.setTimeout(timeout);
            socket.on('connect', () => {
                socket.destroy();
                resolve(true);
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
            });

            socket.on('error', () => {
                resolve(false);
            });

            socket.connect(port, ip);
        });
    }

    async discoverRTSPForCamera(cameraInfo) {
        const { ip, manufacturer } = cameraInfo;
        const config = this.manufacturerDatabase[manufacturer];

        console.log(`Testing RTSP for ${manufacturer} camera at ${ip}...`);

        // Try manufacturer-specific configurations first
        for (const port of config.defaultPorts) {
            console.log(`  Testing port ${port}...`);

            for (const path of config.rtspPaths) {
                for (const creds of config.defaultCredentials) {
                    const rtspUrl = `rtsp://${creds.username}:${creds.password}@${ip}:${port}${path}`;

                    console.log(`    Testing: ${creds.username}:${creds.password || '(empty)'}@${ip}:${port}${path}`);

                    if (await this.testRTSPConnection(rtspUrl)) {
                        console.log(`    ✓ RTSP connection successful!`);
                        return {
                            id: `${ip}_${port}`,
                            ip: ip,
                            port: port,
                            manufacturer: manufacturer,
                            name: `${manufacturer.toUpperCase()} Camera (${ip})`,
                            rtspUrl: rtspUrl,
                            credentials: creds,
                            path: path,
                            status: 'online'
                        };
                    }
                }
            }
        }

        console.log(`  ✗ No working RTSP configuration found for ${ip}`);
        return null;
    }

    async testRTSPConnection(rtspUrl) {
        return new Promise((resolve) => {
            let socket;
            try {
                // Parse RTSP URL more robustly
                let host, port, path;
                try {
                    // Handle cases where URL might have authentication
                    const cleanUrl = rtspUrl.includes('@')
                        ? 'rtsp://' + rtspUrl.split('@')[1]
                        : rtspUrl;
                    const url = new URL(cleanUrl);
                    host = url.hostname;
                    port = url.port || 554;
                    path = url.pathname + (url.search || '');
                } catch (e) {
                    console.error(`Invalid RTSP URL format: ${rtspUrl}`, e);
                    return resolve(false);
                }

                socket = new net.Socket();
                socket.setTimeout(5000);

                socket.on('connect', () => {
                    try {
                        // Send RTSP OPTIONS request
                        const request = [
                            'OPTIONS * RTSP/1.0',
                            'CSeq: 1',
                            'User-Agent: CameraDiscovery/1.0',
                            'Accept: application/sdp',
                            ''
                        ].join('\r\n');

                        socket.write(request);
                    } catch (err) {
                        console.error(`Error sending RTSP request to ${rtspUrl}:`, err.message);
                        if (socket) socket.destroy();
                        resolve(false);
                    }
                });

                socket.on('data', (data) => {
                    try {
                        const response = data.toString();
                        console.log(`RTSP Response from ${host}:${port}${path}: ${response.substring(0, 200)}${response.length > 200 ? '...' : ''}`);

                        // Check for successful RTSP response
                        const isValidResponse = response.startsWith('RTSP/1.0 200') ||
                            response.includes('RTSP/1.0 200') ||
                            response.includes('RTSP/1.0 401') ||
                            response.includes('RTSP/1.0 454');

                        if (socket) socket.destroy();
                        resolve(isValidResponse);
                    } catch (err) {
                        console.error(`Error processing RTSP response from ${rtspUrl}:`, err.message);
                        if (socket) socket.destroy();
                        resolve(false);
                    }
                });

                socket.on('timeout', () => {
                    console.log(`RTSP connection timed out for ${rtspUrl}`);
                    if (socket) socket.destroy();
                    resolve(false);
                });

                socket.on('error', (err) => {
                    console.error(`RTSP connection error for ${rtspUrl}:`, err.message);
                    if (socket) socket.destroy();
                    resolve(false);
                });

                // Connect with error handling
                console.log(`Attempting to connect to RTSP: ${host}:${port}${path}`);
                socket.connect(port, host);
            } catch (error) {
                console.error(`Unexpected error in testRTSPConnection for ${rtspUrl}:`, error.message);
                if (socket) socket.destroy();
                resolve(false);
            }
        });
    }
}

module.exports = CameraDiscovery;