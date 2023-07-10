const express = require('express');
const socket = require('socket.io');

const app = express();
const cors = require('cors');
const PORT=5003;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
app.use(cors()); 

const io = socket(server, {
    cors: {
        origin: '*',
    }
});

io.on ('connection', (socket) => {
    socket.on('joinRoom', (roomName) => {
        socket.join(roomName);
    });
    socket.on('candidate', (candidate, roomName) => {
        socket.broadcast.to(roomName).emit('candidate', candidate);
    });
    socket.on('offer', (offer, roomName) => {
        console.log('server offer: ' + roomName);
        socket.broadcast.to(roomName).emit('offer', offer);
    })
    socket.on('answer', (answer, roomName) => {
        console.log('server answer' + roomName);
        socket.broadcast.to(roomName).emit('answer', answer);
    })
})