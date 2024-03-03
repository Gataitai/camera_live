const express = require('express');
const PiCamera = require('pi-camera');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io');

const port = process.env.PORT || 3000;
// Default endpoint to serve HTML page with video player
app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

const myCamera = new PiCamera({
    mode: 'photo',
    width: 640,
    height: 480,
    nopreview: true
});
setInterval(() => {
    myCamera.snap()
        .then((result) => {
            io.emit('image', result);
        })
        .catch((error) => {
            console.log(error);
        });

}, 1000);

// Start the server
server.listen(3000);
