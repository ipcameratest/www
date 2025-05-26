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
                    '/cam/realmonitor?channel=1&subtype=0'
                ],
                defaultCredentials: [
                    { username: 'admin', password: 'admin' },
                    { username: 'admin', password: '12345' },
                    { username: 'admin', password: '' }
                ],
                httpPort: 80,
                identification: ['hikvision', 'hik-connect']
            },
            'dahua': {
                defaultPorts: [554, 37777],
                rtspPaths: [
                    '/cam/realmonitor?channel=1&subtype=0',
                    '/live/ch1',
                    '/cam/realmonitor?channel=1&subtype=1'
                ],
                defaultCredentials: [
                    { username: 'admin', password: 'admin' },
                    { username: 'admin', password: '123456' }
                ],
                httpPort: 80,
                identification: ['dahua', 'dh-']
            },
            'axis': {
                defaultPorts: [554],
                rtspPaths: [
                    '/axis-media/media.amp',
                    '/mpeg4/media.amp',
                    '/mjpg/video.mjpg'
                ],
                defaultCredentials: [
                    { username: 'root', password: 'pass' },
                    { username: 'admin', password: 'admin' }
                ],
                httpPort: 80,
                identification: ['axis']
            },
            'foscam': {
                defaultPorts: [554, 88],
                rtspPaths: [
                    '/videoMain',
                    '/videoSub',
                    '/11'
                ],
                defaultCredentials: [
                    { username: 'admin', password: '' },
                    { username: 'admin', password: 'admin' }
                ],
                httpPort: 88,
                identification: ['foscam']
            },
            'tp-link': {
                defaultPorts: [554],
                rtspPaths: [
                    '/stream1',
                    '/stream2',
                    '/h264Preview_01_main'
                ],
                defaultCredentials: [
                    { username: 'admin', password: 'admin' }
                ],
                httpPort: 80,
                identification: ['tp-link', 'tapo']
            }
        };
    }

    async scanNetwork() {
        console.log('Starting network scan...');
        this.discoveredCameras = [];

        const networkRange = process.env.NETWORK_RANGE || '192.168.1.0/24';
        const ips = this.generateIPRange(networkRange);

        const concurrency = parseInt(process.env.MAX_CONCURRENT_SCANS) || 50;
        const chunks = this.chunkArray(ips, concurrency);

        for (const chunk of chunks) {
            await Promise.all(chunk.map(ip => this.scanIP(ip)));
        }

        console.log(`Scan complete. Found ${this.discoveredCameras.length} cameras.`);
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

    async scanIP(ip) {
        try {
            // First check if host is alive
            const pingResult = await ping.promise.probe(ip, {
                timeout: parseInt(process.env.SCAN_TIMEOUT) || 5000
            });

            if (!pingResult.alive) return;

            console.log(`Scanning ${ip}...`);

            // Try to identify manufacturer
            const manufacturer = await this.identifyManufacturer(ip);

            if (manufacturer) {
                const camera = await this.discoverCamera(ip, manufacturer);
                if (camera) {
                    this.discoveredCameras.push(camera);
                    console.log(`Found camera: ${camera.name} at ${ip}`);
                }
            }
        } catch (error) {
            // Silently continue on errors
        }
    }

    async identifyManufacturer(ip) {
        // Try common HTTP ports
        const httpPorts = [80, 8080, 8000, 443];

        for (const port of httpPorts) {
            try {
                const response = await axios.get(`http://${ip}:${port}`, {
                    timeout: 3030,
                    validateStatus: () => true
                });

                const html = response.data.toLowerCase();

                for (const [manufacturer, config] of Object.entries(this.manufacturerDatabase)) {
                    for (const identifier of config.identification) {
                        if (html.includes(identifier)) {
                            return manufacturer;
                        }
                    }
                }
            } catch (error) {
                continue;
            }
        }

        // If no HTTP identification, try port scanning for common RTSP ports
        for (const [manufacturer, config] of Object.entries(this.manufacturerDatabase)) {
            for (const port of config.defaultPorts) {
                if (await this.isPortOpen(ip, port)) {
                    return manufacturer;
                }
            }
        }

        return null;
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

    async discoverCamera(ip, manufacturer) {
        const config = this.manufacturerDatabase[manufacturer];

        for (const port of config.defaultPorts) {
            for (const path of config.rtspPaths) {
                for (const creds of config.defaultCredentials) {
                    const rtspUrl = `rtsp://${creds.username}:${creds.password}@${ip}:${port}${path}`;

                    if (await this.testRTSPConnection(rtspUrl)) {
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

        return null;
    }

    async testRTSPConnection(rtspUrl) {
        return new Promise((resolve) => {
            // Simple RTSP connection test
            const url = new URL(rtspUrl.replace('rtsp://', 'http://'));
            const socket = new net.Socket();

            socket.setTimeout(3000);
            socket.on('connect', () => {
                socket.write('OPTIONS * RTSP/1.0\r\nCSeq: 1\r\n\r\n');
            });

            socket.on('data', (data) => {
                socket.destroy();
                resolve(data.toString().includes('RTSP/1.0 200'));
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
            });

            socket.on('error', () => {
                resolve(false);
            });

            socket.connect(url.port, url.hostname);
        });
    }
}

module.exports = CameraDiscovery;