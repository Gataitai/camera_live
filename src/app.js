const express = require('express');
const app = express();
const RaspiCam = require('raspicam');

// Configure options for the camera
const cameraOpts = {
    mode: "video",
    output: "video.h264",
    timeout: -1, // Capture video indefinitely
    width: 640,
    height: 480,
    // Update the path to raspivid
    command: '/usr/bin/raspivid'
};

// Create a new instance of RaspiCam with the options
const camera = new RaspiCam(cameraOpts);

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

    // Pipe the video stream from the camera output to the response
    camera.start();
    camera.on("read", (err, timestamp, filename) => {
        if (!err) {
            const fileStream = fs.createReadStream(filename);
            fileStream.pipe(res);
        } else {
            console.error("Error reading file:", err);
        }
    });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Listen for the process to exit
process.on('SIGINT', () => {
    console.log("Exiting...");
    camera.stop();
    process.exit();
});
