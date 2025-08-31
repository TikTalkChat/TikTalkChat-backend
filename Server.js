const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Frontend URL allow karein
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// User pairing ke liye variables
const waitingUsers = [];
const connectedPairs = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  waitingUsers.push(socket.id);
  socket.emit('system', { text: 'waiting' });

  // Pairing logic
  if (waitingUsers.length >= 2) {
    const user1 = waitingUsers.shift();
    const user2 = waitingUsers.shift();
    connectedPairs[user1] = user2;
    connectedPairs[user2] = user1;
    io.to(user1).emit('system', { text: 'connected' });
    io.to(user2).emit('system', { text: 'connected' });
  }

  // Messages handle karo
  socket.on('message', (data) => {
    try {
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      const partnerId = connectedPairs[socket.id];
      if (partnerId) {
        io.to(partnerId).emit('message', parsedData);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const partnerId = connectedPairs[socket.id];
    if (partnerId) {
      io.to(partnerId).emit('system', { text: 'disconnected' });
      delete connectedPairs[partnerId];
      waitingUsers.push(partnerId);
    }
    delete connectedPairs[socket.id];
    // Waiting list se remove karo
    const index = waitingUsers.indexOf(socket.id);
    if (index !== -1) {
      waitingUsers.splice(index, 1);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});