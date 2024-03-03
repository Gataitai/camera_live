const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();

// Function to capture a single frame and send it as JPEG
function capturePhoto(callback) {
    // Create a writable stream to capture the photo
    const photoStream = fs.createWriteStream('photo.jpg');

    // Use ffmpeg to capture a single frame from the video stream
    const ffmpegProcess = spawn('ffmpeg', ['-i', 'pipe:0', '-frames:v', '1', '-f', 'image2', 'pipe:1']);

    // Pipe the video stream into ffmpeg
    videoStream.pipe(ffmpegProcess.stdin);

    // Pipe the output of ffmpeg into the photo stream
    ffmpegProcess.stdout.pipe(photoStream);

    // When ffmpeg finishes, call the callback function
    ffmpegProcess.on('exit', () => {
        callback();
    });
}

// Spawn raspivid process
const raspividProcess = spawn('raspivid', ['-o', '-']);

// Create a writable stream to capture the video output
const videoStream = raspividProcess.stdout;

// Endpoint to serve index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Endpoint to capture a photo and send it
app.get('/photo', (req, res) => {
    capturePhoto(() => {
        res.sendFile(__dirname + '/photo.jpg');
    });
});

// Start the Express server
const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
