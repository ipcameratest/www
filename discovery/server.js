const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const CameraDiscovery = require('./lib/camera-discovery');
const RTSPStreamer = require('./lib/rtsp-streamer');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const cameraDiscovery = new CameraDiscovery();
const rtspStreamer = new RTSPStreamer();

app.use(express.static('public'));
app.use(express.json());

// API Routes
app.get('/api/scan', async (req, res) => {
    try {
        const cameras = await cameraDiscovery.scanNetwork();
        res.json(cameras);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/cameras', (req, res) => {
    res.json(cameraDiscovery.discoveredCameras);
});

app.post('/api/stream/:id', async (req, res) => {
    try {
        const cameraId = req.params.id;
        const camera = cameraDiscovery.discoveredCameras.find(c => c.id === cameraId);

        if (!camera) {
            return res.status(404).json({ error: 'Camera not found' });
        }

        const streamUrl = await rtspStreamer.startStream(camera);
        res.json({ streamUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/stream/:id', (req, res) => {
    const cameraId = req.params.id;
    rtspStreamer.stopStream(cameraId);
    res.json({ success: true });
});

// WebSocket for real-time updates
wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', async (message) => {
        const data = JSON.parse(message);

        if (data.type === 'scan') {
            try {
                const cameras = await cameraDiscovery.scanNetwork();
                ws.send(JSON.stringify({ type: 'scan_result', cameras }));
            } catch (error) {
                ws.send(JSON.stringify({ type: 'error', message: error.message }));
            }
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.WEB_PORT || 3030;
server.listen(PORT, () => {
    console.log(`Camera RTSP Discovery System running on port ${PORT}`);
    console.log(`Web interface: http://localhost:${PORT}`);
});