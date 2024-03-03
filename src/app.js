const express = require('express');
const { spawn } = require('child_process');

const app = express();

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Set up the /video route to stream transcoded video
app.get('/video', (req, res) => {
    // Set response headers for chunked transfer encoding
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Spawn raspivid process to capture video
    const raspivid = spawn('raspivid', ['-t', '0', '-w', '1280', '-h', '720', '-fps', '25', '-o', '-']);

    // Spawn ffmpeg process to transcode video from H.264 to MP4
    const ffmpeg = spawn('ffmpeg', [
        '-f', 'h264', // Input format is H.264
        '-i', '-',    // Read from stdin
        '-c:v', 'copy', // Copy video codec (no transcoding)
        '-f', 'mp4',  // Output format is MP4
        '-'           // Output to stdout
    ]);

    // Pipe raspivid stdout to ffmpeg stdin
    raspivid.stdout.pipe(ffmpeg.stdin);

    // Pipe ffmpeg stdout to response
    ffmpeg.stdout.pipe(res);

    // Handle process exit
    raspivid.on('exit', (code, signal) => {
        console.log(`raspivid process exited with code ${code} and signal ${signal}`);
        res.end(); // End the response when raspivid process exits
    });

    ffmpeg.on('exit', (code, signal) => {
        console.log(`ffmpeg process exited with code ${code} and signal ${signal}`);
        res.end(); // End the response when ffmpeg process exits
    });

    // Handle client disconnection
    res.on('close', () => {
        console.log('Client disconnected');
        raspivid.kill(); // Terminate raspivid process if client disconnects
        ffmpeg.kill();   // Terminate ffmpeg process if client disconnects
    });
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
