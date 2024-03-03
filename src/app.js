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
