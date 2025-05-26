const { spawn } = require('child_process');
const WebSocket = require('ws');

class RTSPStreamer {
    constructor() {
        this.activeStreams = new Map();
        this.streamPort = 9999;
        this.wsServers = new Map();
    }

    async startStream(camera) {
        if (this.activeStreams.has(camera.id)) {
            return this.activeStreams.get(camera.id).wsPort;
        }

        const wsPort = this.streamPort++;

        try {
            // Create WebSocket server for this stream
            const wss = new WebSocket.Server({ port: wsPort });
            this.wsServers.set(camera.id, wss);

            // Start FFmpeg process to convert RTSP to MPEG-TS
            const ffmpeg = spawn('ffmpeg', [
                '-i', camera.rtspUrl,
                '-f', 'mpegts',
                '-codec:v', 'mpeg1video',
                '-s', '640x480',
                '-b:v', '1000k',
                '-bf', '0',
                '-r', '25',
                '-codec:a', 'mp2',
                '-ar', '44100',
                '-ac', '1',
                '-b:a', '128k',
                '-muxdelay', '0.001',
                '-fflags', 'nobuffer',
                '-flags', 'low_delay',
                '-'
            ], {
                stdio: ['ignore', 'pipe', 'pipe']
            });

            // Handle FFmpeg output
            ffmpeg.stdout.on('data', (data) => {
                // Broadcast to all connected WebSocket clients
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(data);
                    }
                });
            });

            ffmpeg.stderr.on('data', (data) => {
                console.log(`FFmpeg stderr: ${data}`);
            });

            ffmpeg.on('close', (code) => {
                console.log(`FFmpeg process exited with code ${code}`);
                this.stopStream(camera.id);
            });

            ffmpeg.on('error', (error) => {
                console.error(`FFmpeg error: ${error}`);
                this.stopStream(camera.id);
            });

            this.activeStreams.set(camera.id, {
                ffmpeg: ffmpeg,
                wss: wss,
                wsPort: wsPort,
                camera: camera
            });

            console.log(`Started stream for ${camera.name} on WebSocket port ${wsPort}`);
            return wsPort;
        } catch (error) {
            console.error(`Failed to start stream for ${camera.name}:`, error);
            throw error;
        }
    }

    stopStream(cameraId) {
        if (this.activeStreams.has(cameraId)) {
            const streamInfo = this.activeStreams.get(cameraId);

            // Kill FFmpeg process
            if (streamInfo.ffmpeg) {
                streamInfo.ffmpeg.kill('SIGTERM');
            }

            // Close WebSocket server
            if (streamInfo.wss) {
                streamInfo.wss.close();
            }

            this.activeStreams.delete(cameraId);
            this.wsServers.delete(cameraId);
            console.log(`Stopped stream for camera ${cameraId}`);
        }
    }

    stopAllStreams() {
        for (const [cameraId] of this.activeStreams) {
            this.stopStream(cameraId);
        }
    }
}

module.exports = RTSPStreamer;