const express = require('express');
const PiCamera = require('pi-camera');
const fs = require('fs');

const app = express();

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
            <a id="downloadLink" download="video.mp4" href="#">Download Video</a>
            <script>
                const downloadLink = document.getElementById('downloadLink');
                
                fetch('/video-feed')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.blob();
                    })
                    .then(blob => {
                        const videoURL = URL.createObjectURL(blob);
                        downloadLink.href = videoURL;
                        downloadLink.style.display = 'block'; // Show the download link
                    })
                    .catch(error => {
                        console.error('Error fetching video:', error);
                    });
            </script>
        </body>
        </html>

    `);
});

// Endpoint to serve the recorded video file
app.get('/video-feed', async (req, res) => {
    try {
        // Create a new PiCamera instance with the options
        const myCamera = new PiCamera({
            mode: 'video',
            output: `${__dirname}/video.h264`,
            width: 640,
            height: 480,
            timeout: 5000, // Record for 5 seconds
            nopreview: true
        });

        // Start recording
        await myCamera.record();

        // Set response headers for video file
        res.setHeader('Content-Type', 'video/mp4');

        // Send back the recorded video file
        const fileStream = fs.createReadStream(`${__dirname}/video.h264`);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error recording video:', error);
        res.status(500).send('Error recording video');
    }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
