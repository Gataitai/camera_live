const express = require('express');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Start raspivid to capture video frames
const raspivid = spawn('raspivid', [
    '-t', '0',          // No timeout
    '-w', '640',        // Width
    '-h', '480',        // Height
    '-fps', '1',       // Frames per second
    '-o', '-.jpg'       // Output JPEG images to stdout
]);

// Buffer to store captured image data
let imageData = Buffer.alloc(0);

raspivid.stdout.on('data', (data) => {
    imageData = Buffer.concat([imageData, data]);
});

raspivid.on('error', (error) => {
    console.error('Error running raspivid:', error);
});

raspivid.on('close', (code) => {
    console.log(`raspivid process exited with code ${code}`);
});

// Serve the index.html file when accessing the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route to capture and send a single frame from raspivid
app.get('/photo', (req, res) => {
    if (imageData) {
        console.log('Sending image data...');
        res.set('Content-Type', 'image/jpeg');
        res.send(imageData);
    } else {
        console.error('Error: No image data available');
        res.status(500).send('Error: No image data available');
    }
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
