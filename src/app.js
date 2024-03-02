const express = require('express');
const PiCamera = require('pi-camera');
const WebSocket = require('ws');
const fs = require('fs');

const app = express();

// Set up WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
    console.log('Client connected');

    // Send video frames to client
    const sendVideoFrames = async () => {
        try {
            // Create a new PiCamera instance with the options
            const myCamera = new PiCamera({
                mode: 'video',
                width: 640,
                height: 480,
                timeout: 5000, // Record for 5 seconds
                nopreview: true
            });

            // Start recording
            const videoStream = await myCamera.record();

            // Stream video frames to WebSocket client
            videoStream.on('data', data => {
                ws.send(data);
            });

            // Handle errors
            videoStream.on('error', error => {
                console.error('Error capturing video:', error);
            });
        } catch (error) {
            console.error('Error recording video:', error);
        }
    };

    // Start sending video frames when client connects
    sendVideoFrames();

    // Handle client disconnect
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Default endpoint to serve HTML page with video player
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Raspberry Pi Live Video Stream</title>
    </head>
    <body>
        <h1>Raspberry Pi Live Video Stream</h1>
        <video id="videoPlayer" autoplay></video>
        
        <script>
            const video = document.getElementById('videoPlayer');
            const ws = new WebSocket('ws://localhost:8080');

            ws.onmessage = event => {
                video.src = URL.createObjectURL(new Blob([event.data], { type: 'video/h264' }));
            };
        </script>
    </body>
    </html>
    `);
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
