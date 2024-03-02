const express = require('express');
const PiCamera = require('pi-camera');
const WebSocket = require('ws');

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
                timeout: 0, // Record indefinitely
                nopreview: true
            });

            // Start recording
            const videoStream = await myCamera.record();

            // Stream video frames to WebSocket client
            videoStream.on('data', data => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(data);
                }
            });

            // Handle errors
            videoStream.on('error', error => {
                console.error('Error capturing video:', error);
                ws.close(); // Close WebSocket connection on error
            });
        } catch (error) {
            console.error('Error recording video:', error);
            ws.close(); // Close WebSocket connection on error
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
            const ws = new WebSocket('wss://localhost:8080');

            ws.onmessage = event => {
                const blob = new Blob([event.data], { type: 'video/h264' });
                const videoURL = URL.createObjectURL(blob);
                video.src = videoURL;
            };

            ws.onerror = event => {
                console.error('WebSocket error:', event);
            };

            ws.onclose = event => {
                console.log('WebSocket closed:', event);
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
