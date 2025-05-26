class CameraApp {
    constructor() {
        this.cameras = [];
        this.ws = null;
        this.currentStream = null;
        this.initializeWebSocket();
        this.bindEvents();
    }

    initializeWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.ws = new WebSocket(`${protocol}//${window.location.host}`);

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'scan_result':
                this.cameras = data.cameras;
                this.renderCameras();
                this.hideLoading();
                break;
            case 'error':
                console.error('WebSocket error:', data.message);
                this.hideLoading();
                break;
        }
    }

    bindEvents() {
        document.getElementById('scanBtn').addEventListener('click', () => {
            this.scanNetwork();
        });

        document.querySelector('.close').addEventListener('click', () => {
            this.closeStreamModal();
        });

        document.getElementById('stopStreamBtn').addEventListener('click', () => {
            this.stopCurrentStream();
        });

        window.addEventListener('click', (event) => {
            const modal = document.getElementById('streamModal');
            if (event.target === modal) {
                this.closeStreamModal();
            }
        });
    }

    async scanNetwork() {
        this.showLoading();

        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'scan' }));
        } else {
            // Fallback to HTTP API
            try {
                const response = await fetch('/api/scan');
                const cameras = await response.json();
                this.cameras = cameras;
                this.renderCameras();
            } catch (error) {
                console.error('Scan failed:', error);
            } finally {
                this.hideLoading();
            }
        }
    }

    renderCameras() {
        const grid = document.getElementById('cameraGrid');
        grid.innerHTML = '';

        if (this.cameras.length === 0) {
            grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No cameras found. Try scanning again.</p>';
            return;
        }

        this.cameras.forEach(camera => {
            const card = this.createCameraCard(camera);
            grid.appendChild(card);
        });
    }

    createCameraCard(camera) {
        const card = document.createElement('div');
        card.className = 'camera-card';

        card.innerHTML = `
            <div class="camera-header">
                <div class="camera-name">${camera.name}</div>
                <div class="status ${camera.status}">${camera.status.toUpperCase()}</div>
            </div>
            <div class="camera-info">
                <p><strong>IP:</strong> ${camera.ip}</p>
                <p><strong>Port:</strong> ${camera.port}</p>
                <p><strong>Manufacturer:</strong> ${camera.manufacturer}</p>
                <p><strong>RTSP Path:</strong> ${camera.path}</p>
            </div>
            <div class="camera-actions">
                <button class="btn btn-success" onclick="app.startStream('${camera.id}')">
                    View Stream
                </button>
            </div>
        `;

        return card;
    }

    async startStream(cameraId) {
        try {
            const response = await fetch(`/api/stream/${cameraId}`, {
                method: 'POST'
            });

            const data = await response.json();

            if (response.ok) {
                this.showStreamModal(cameraId, data.streamUrl);
            } else {
                alert('Failed to start stream: ' + data.error);
            }
        } catch (error) {
            console.error('Stream start failed:', error);
            alert('Failed to start stream');
        }
    }

    showStreamModal(cameraId, wsPort) {
        const camera = this.cameras.find(c => c.id === cameraId);
        const modal = document.getElementById('streamModal');
        const title = document.getElementById('streamTitle');
        const canvas = document.getElementById('streamCanvas');

        title.textContent = camera.name;
        modal.classList.remove('hidden');

        // Initialize JSMpeg player with proper WebSocket URL
        const wsUrl = `ws://${window.location.hostname}:${wsPort}`;

        this.currentStream = new JSMpeg.Player(wsUrl, {
            canvas: canvas,
            autoplay: true,
            audio: true,
            video: true,
            loop: false,
            disableGl: false,
            preserveDrawingBuffer: false,
            progressive: false,
            videoBufferSize: 512 * 1024,
            audioBufferSize: 128 * 1024,
            maxAudioLag: 1,
            onSourceEstablished: () => {
                console.log('Stream connection established');
            },
            onSourceCompleted: () => {
                console.log('Stream completed');
            },
            onStalled: () => {
                console.log('Stream stalled - buffering...');
            }
        });

        this.currentStreamId = cameraId;
    }

    closeStreamModal() {
        const modal = document.getElementById('streamModal');
        modal.classList.add('hidden');

        if (this.currentStream) {
            this.currentStream.destroy();
            this.currentStream = null;
        }

        this.currentStreamId = null;
    }

    async stopCurrentStream() {
        if (this.currentStreamId) {
            try {
                await fetch(`/api/stream/${this.currentStreamId}`, {
                    method: 'DELETE'
                });
            } catch (error) {
                console.error('Failed to stop stream:', error);
            }
        }

        this.closeStreamModal();
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }
}
// Initialize the app
const app = new CameraApp();

// Load cameras on page load
window.addEventListener('load', () => {
    app.scanNetwork();
});