const express = require('express');
const { spawn } = require('child_process');

const app = express();

// Endpoint to serve index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Endpoint to stream video feed in MP4 format
app.get('/video', (req, res) => {
    // Set response headers for streaming video
    res.setHeader('Content-Type', 'video/mp4'); // Set content type to MP4
    res.setHeader('Transfer-Encoding', 'chunked'); // Use chunked transfer encoding

    // Spawn raspivid process
    const raspividProcess = spawn('raspivid', ['-t', '0', '-o', '-']);

    // Spawn ffmpeg process to convert raw H.264 to MP4
    const ffmpegProcess = spawn('ffmpeg', [
        '-f', 'h264',          // Input format
        '-i', '-',             // Read input from stdin
        '-c:v', 'copy',        // Copy video codec (no re-encoding)
        '-movflags', 'frag_keyframe+empty_moov', // Make the MP4 file streamable
        '-f', 'mp4',           // Output format
        'pipe:1'               // Output to stdout
    ]);

    // Pipe raspivid output to ffmpeg input
    raspividProcess.stdout.pipe(ffmpegProcess.stdin);

    // Pipe ffmpeg output to response
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
