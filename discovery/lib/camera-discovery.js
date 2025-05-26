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

    async checkWebInterface(ip, port) {
        try {
            const protocols = port === 443 ? ['https'] : ['http'];

            for (const protocol of protocols) {
                try {
                    const response = await axios.get(`${protocol}://${ip}:${port}`, {
                        timeout: 3000,
                        validateStatus: () => true,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        },
                        maxRedirects: 2
                    });

                    if (response.status === 200 || response.status === 401 || response.status === 403) {
                        const html = (response.data || '').toLowerCase();
                        const headers = JSON.stringify(response.headers).toLowerCase();
                        const combined = html + ' ' + headers;

                        // Check for camera-specific indicators
                        const cameraIndicators = [
                            'camera', 'video', 'stream', 'surveillance', 'ipcam', 'webcam',
                            'dvr', 'nvr', 'cctv', 'security', 'live view', 'video monitor',
                            'login', 'password', 'admin', 'user login', 'device login'
                        ];

                        const hasCameraIndicators = cameraIndicators.some(indicator =>
                            combined.includes(indicator)
                        );

                        if (hasCameraIndicators) {
                            // Try to identify manufacturer
                            const manufacturer = this.identifyManufacturerFromResponse(combined);
                            return {
                                isCamera: true,
                                manufacturer: manufacturer,
                                response: response
                            };
                        }
                    }
                } catch (error) {
                    // Try next protocol
                }
            }
        } catch (error) {
            // Continue
        }

        return { isCamera: false };
    }

    identifyManufacturerFromResponse(content) {
        const manufacturers = [
            { name: 'hikvision', keywords: ['hikvision', 'hik-connect', 'ds-', 'ipc-'] },
            { name: 'dahua', keywords: ['dahua', 'dh-', 'ipc-hfw', 'ipc-hdw'] },
            { name: 'axis', keywords: ['axis', 'vapix'] },
            { name: 'foscam', keywords: ['foscam', 'fi8', 'fi9'] },
            { name: 'tp-link', keywords: ['tp-link', 'tapo', 'kasa'] },
            { name: 'uniview', keywords: ['uniview', 'ipc'] },
            { name: 'reolink', keywords: ['reolink'] },
            { name: 'vivotek', keywords: ['vivotek'] },
            { name: 'mobotix', keywords: ['mobotix'] },
            { name: 'bosch', keywords: ['bosch', 'flexidome', 'dinion'] },
            { name: 'pelco', keywords: ['pelco'] },
            { name: 'panasonic', keywords: ['panasonic', 'i-pro'] },
            { name: 'sony', keywords: ['sony'] },
            { name: 'samsung', keywords: ['samsung', 'hanwha'] }
        ];

        for (const manufacturer of manufacturers) {
            for (const keyword of manufacturer.keywords) {
                if (content.includes(keyword)) {
                    return manufacturer.name;
                }
            }
        }

        return 'generic';
    }

    // Removed deprecated methods that were moved to other parts of the code
                } catch (error) {
                    // Continue to next port/manufacturer
                }
            }
        }
        return null;
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
            try {
                const url = new URL(rtspUrl.replace('rtsp://', 'http://'));
                const socket = new net.Socket();

                socket.setTimeout(5000);
                socket.on('connect', () => {
                    // Send RTSP OPTIONS request
                    const request = [
                        'OPTIONS * RTSP/1.0',
                        'CSeq: 1',
                        'User-Agent: CameraDiscovery/1.0',
                        '',
                        ''
                    ].join('\r\n');

                    socket.write(request);
                });

                socket.on('data', (data) => {
                    const response = data.toString();
                    socket.destroy();

                    // Check for successful RTSP response
                    if (response.includes('RTSP/1.0 200') ||
                        response.includes('RTSP/1.0 401') ||
                        response.includes('RTSP/1.0 454')) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                });

                socket.on('timeout', () => {
                    socket.destroy();
                    resolve(false);
                });

                socket.on('error', () => {
                    resolve(false);
                });

                socket.connect(url.port || 554, url.hostname);
            } catch (error) {
                resolve(false);
            }
        });
    }
}

module.exports = CameraDiscovery;