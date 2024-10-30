const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files (DASH segments and MPD)
app.use('/dash', express.static(path.join(__dirname, 'dash')));

// Serve the HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
