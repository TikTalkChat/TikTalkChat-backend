const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); // CORS allow sabse important

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',  // ya Render frontend URL specify kar sakte ho
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('message', (msg) => {
    io.emit('message', msg); // broadcast all messages
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3000; // Render automatically assign karta hai
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});