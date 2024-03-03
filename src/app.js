const express = require('express');
const { spawn } = require('child_process');

const app = express();

// Spawn raspivid process
const raspividProcess = spawn('raspivid', ['-t', '0', '-o', '-']);

// Endpoint to serve index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Endpoint to stream video feed
app.get('/video', (req, res) => {
    // Set response headers for streaming video
    res.setHeader('Content-Type', 'video/h264'); // Correct content type for raw H.264 video
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Pipe raspivid output directly to response
    raspividProcess.stdout.pipe(res);

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
