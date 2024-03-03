const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve the index.html file when accessing the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route to capture and send a single frame from raspivid
app.get('/photo', (req, res) => {
    // Start raspistill to capture a single frame
    const raspistill = spawn('raspistill', [
        '-w', '640',    // Width
        '-h', '480',    // Height
        '-o', '-'       // Output to stdout
    ]);

    // Buffer to store captured image data
    let imageData = Buffer.alloc(0);

    // Concatenate data chunks from raspistill
    raspistill.stdout.on('data', (chunk) => {
        imageData = Buffer.concat([imageData, chunk]);
    });

    // Send captured image data when raspistill exits
    raspistill.on('close', (code) => {
        if (code === 0) {
            res.set('Content-Type', 'image/jpeg');
            res.send(imageData);
        } else {
            res.status(500).send('Error capturing photo');
        }
    });
});

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Start streaming camera preview frames
    const raspivid = spawn('raspivid', [
        '-t', '0',          // No timeout
        '-w', '640',        // Width
        '-h', '480',        // Height
        '-fps', '25',       // Frames per second
        '-o', '-'           // Output to stdout
    ]);

    // Pipe camera output to WebSocket client
    raspivid.stdout.on('data', (data) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
        }
    });

    // Handle WebSocket client disconnect
    ws.on('close', () => {
        console.log('Client disconnected');
        // Terminate raspivid process when client disconnects
        raspivid.kill('SIGINT');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
