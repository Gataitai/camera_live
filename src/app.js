const express = require('express');
const { spawn } = require('child_process');

const app = express();

// Endpoint to serve index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Endpoint to stream video feed
app.get('/video', (req, res) => {
    // Spawn raspivid process with desired resolution
    const raspividProcess = spawn('raspivid', ['-t', '0', '-o', '-', '-w', '1280', '-h', '720']);

    // Set response headers for streaming video
    res.setHeader('Content-Type', 'video/mp4'); // Set content type to MP4
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Pipe raspivid output through ffmpeg to change container format and resolution
    raspividProcess.stdout.pipe(ffmpegProcess.stdin);

    // Handle errors
    raspividProcess.stderr.on('data', (data) => {
        console.error(`raspivid error: ${data}`);
    });

    res.on('close', () => {
        // Clean up resources when client disconnects
        console.log('Client disconnected');
        raspividProcess.kill();
    });
});

// Start the Express server
const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
