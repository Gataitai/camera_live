const express = require('express');
const { spawn } = require('child_process');

const app = express();

// Initialize ffmpeg process
const ffmpegProcess = spawn('ffmpeg', [
    '-hide_banner',
    '-f', 'h264',
    '-i', '-',
    '-c:v', 'copy',
    '-f', 'mpegts', // Change output format to MPEG-TS
    'pipe:1'
]);

// Endpoint to serve index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Endpoint to stream video feed
app.get('/video', (req, res) => {
    // Spawn raspivid process
    const raspividProcess = spawn('raspivid', ['-t', '0', '-o', '-']);

    // Set response headers for streaming video
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Pipe raspivid output directly to ffmpeg process
    raspividProcess.stdout.pipe(ffmpegProcess.stdin);

    // Pipe ffmpeg output directly to response
    ffmpegProcess.stdout.pipe(res);

    // Handle errors
    raspividProcess.stderr.on('data', (data) => {
        console.error(`raspivid error: ${data}`);
    });

    ffmpegProcess.stderr.on('data', (data) => {
        console.error(`ffmpeg error: ${data}`);
    });

    res.on('close', () => {
        // Clean up resources when client disconnects
        console.log('Client disconnected');
        raspividProcess.kill();
        ffmpegProcess.kill();
    });
});

// Start the Express server
const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
