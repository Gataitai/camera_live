const express = require('express');
const { spawn } = require('child_process');

const app = express();

// Spawn raspivid process
const raspividProcess = spawn('raspivid', ['-t', '0', '-o', '-']);

// Endpoint to serve index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Endpoint to capture a photo and send it
app.get('/photo', (req, res) => {
    // Use ffmpeg to capture a single frame from the video stream and send it directly
    const ffmpegProcess = spawn('ffmpeg', ['-i', 'pipe:0', '-frames:v', '1', '-f', 'image2', 'pipe:1']);

    raspividProcess.stdout.pipe(ffmpegProcess.stdin);
    ffmpegProcess.stdout.pipe(res);

    // Handle errors
    raspividProcess.stderr.on('data', (data) => {
        console.error(`raspivid error: ${data}`);
    });

    ffmpegProcess.stderr.on('data', (data) => {
        console.error(`ffmpeg error: ${data}`);
    });
});

// Start the Express server
const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
