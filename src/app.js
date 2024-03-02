const express = require('express');
const { spawn } = require('child_process');
const PiCamera = require('pi-camera');

const app = express();

let cameraProcess;

// Default endpoint to serve HTML page with video element
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Raspberry Pi Video Stream</title>
        </head>
        <body>
            <h1>Raspberry Pi Video Stream</h1>
            <video id="videoPlayer" controls autoplay></video>
            <script>
                const video = document.getElementById('videoPlayer');
                video.src = '/video-feed';
            </script>
        </body>
        </html>
    `);
});


// Endpoint to serve the video feed
app.get('/video-feed', (req, res) => {
    // Set response headers for video stream
    res.setHeader('Content-Type', 'video/mp4');

    // Create a new PiCamera instance with the options
    const myCamera = new PiCamera({
        mode: 'video',
        output: `${__dirname}/video.h264`,
        width: 640,
        height: 480,
        timeout: 0, // Record indefinitely
        nopreview: true
    });

    // Start recording
    const recordStream = myCamera.record();

    // Pipe the video stream from the camera output to the response
    recordStream.pipe(res);

    // Handle errors
    recordStream.on('error', (error) => {
        console.error('Error capturing video:', error);
        res.end();
    });

    // Handle graceful shutdown
    req.on('close', () => {
        console.log("Connection closed, stopping recording...");
        recordStream.stop();
        if (cameraProcess) {
            // Turn off the camera LED
            spawn('raspistill', ['--led', 'off']);
        }
        res.end();
    });
});

// Start the server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Listen for the process to exit
process.on('SIGINT', () => {
    console.log("Exiting...");
    server.close(() => {
        console.log('Server closed');
    });
    if (cameraProcess) {
        // Turn off the camera LED
        spawn('raspistill', ['--led', 'off']);
    }
    process.exit();
});
