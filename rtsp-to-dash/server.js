const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(express.static('dash'));
app.use(express.json());

app.post('/convert', (req, res) => {
    const rtspUrl = req.body.rtspUrl;
    const outputDir = path.join(__dirname, 'dash');

    exec(`./convert.sh ${rtspUrl} ${outputDir}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('Conversion failed');
        }
        res.send('Conversion started');
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
