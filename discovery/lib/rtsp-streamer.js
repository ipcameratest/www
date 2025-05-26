const Stream = require('node-rtsp-stream');

class RTSPStreamer {
    constructor() {
        this.activeStreams = new Map();
        this.streamPort = 9999;
    }

    async startStream(camera) {
        if (this.activeStreams.has(camera.id)) {
            return this.activeStreams.get(camera.id).wsPort;
        }

        const wsPort = this.streamPort++;

        try {
            const stream = new Stream({
                name: camera.name,
                streamUrl: camera.rtspUrl,
                wsPort: wsPort,
                ffmpegOptions: {
                    '-stats': '',
                    '-r': 30,
                    '-s': '640x480',
                    '-f': 'mpegts',
                    '-codec:v': 'mpeg1video',
                    '-b:v': '800k',
                    '-bf': 0,
                    '-muxdelay': 0.001
                }
            });

            this.activeStreams.set(camera.id, {
                stream: stream,
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
            streamInfo.stream.stop();
            this.activeStreams.delete(cameraId);
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