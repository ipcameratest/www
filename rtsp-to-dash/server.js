const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3033;

// Store active conversion process
let conversionProcess = null;

// Ensure dash directory exists
const dashDir = path.join(__dirname, 'dash');
if (!fs.existsSync(dashDir)) {
    fs.mkdirSync(dashDir, { recursive: true });
}

// Enable CORS
app.use(cors());

// Serve static files
app.use(express.static('client/build')); // Serve React app
app.use(express.static('public'));
app.use('/dash', express.static(path.join(__dirname, 'dash')));
app.use(express.json());

// Validate RTSP URL
function isValidRtspUrl(url) {
    return url && url.startsWith('rtsp://');
}

// Clean up function for old process
function cleanupOldProcess() {
    if (conversionProcess) {
        try {
            conversionProcess.kill();
        } catch (err) {
            console.error('Error killing old process:', err);
        }
        conversionProcess = null;
    }
}

app.post('/convert', (req, res) => {
    const rtspUrl = req.body.rtspUrl;

    if (!rtspUrl) {
        return res.status(400).json({ error: 'RTSP URL is required' });
    }

    if (!isValidRtspUrl(rtspUrl)) {
        return res.status(400).json({ error: 'Invalid RTSP URL format' });
    }

    // Clean up old process if exists
    cleanupOldProcess();

    const outputDir = path.join(__dirname, 'dash');
    const convertScript = path.join(__dirname, 'convert.sh');

    // Ensure convert.sh is executable
    fs.chmodSync(convertScript, '755');

    // Start new conversion process
    conversionProcess = spawn(convertScript, [rtspUrl, outputDir]);

    conversionProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    conversionProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    conversionProcess.on('error', (error) => {
        console.error(`Error: ${error.message}`);
        res.status(500).json({ error: 'Conversion failed', details: error.message });
    });

    // Don't wait for process to end, just confirm it started
    res.json({ message: 'Conversion started' });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

// Cleanup on server shutdown
process.on('SIGTERM', cleanupOldProcess);
process.on('SIGINT', cleanupOldProcess);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`DASH content served from ${dashDir}`);
});
