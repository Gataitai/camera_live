const express = require('express');
const { spawn } = require('child_process');

const app = express();

// Set up the /video route to stream raw H.264 data
app.get('/video', (req, res) => {
    // Set response headers for chunked transfer encoding
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Spawn raspivid process to capture video
    const raspivid = spawn('raspivid', ['-t', '0', '-w', '1280', '-h', '720', '-fps', '25', '-o', '-']);

    // Pipe raspivid stdout to response
    raspivid.stdout.pipe(res);

    // Handle process exit
    raspivid.on('exit', (code, signal) => {
        console.log(`raspivid process exited with code ${code} and signal ${signal}`);
        res.end(); // End the response when raspivid process exits
    });
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
