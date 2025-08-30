const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Frontend URL ya '*'
    methods: ['GET', 'POST']
  }
});

// User pairing ke liye
const waitingUsers = [];
const connectedPairs = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // New user ko waiting list mein daalo
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
    console.log(`Paired ${user1} with ${user2}`);
  }
  
  // Messages handle karo
  socket.on('message', (data) => {
    try {
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      if (parsedData.type === 'message') {
        const partnerId = connectedPairs[socket.id];
        if (partnerId) {
          io.to(partnerId).emit('message', {
            type: 'message',
            text: parsedData.text
          });
        }
      } else if (parsedData.type === 'typing') {
        const partnerId = connectedPairs[socket.id];
        if (partnerId) {
          io.to(partnerId).emit('message', { type: 'typing' });
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
  
  // Disconnect handle karo
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const partnerId = connectedPairs[socket.id];
    if (partnerId) {
      io.to(partnerId).emit('system', { text: 'disconnected' });
      delete connectedPairs[partnerId];
      waitingUsers.push(partnerId);
      io.to(partnerId).emit('system', { text: 'waiting' });
    }
    delete connectedPairs[socket.id];
    
    // Waiting list se bhi remove karo
    const index = waitingUsers.indexOf(socket.id);
    if (index !== -1) {
      waitingUsers.splice(index, 1);
    }
  });
});

// Health check endpoint for Render.com
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    waitingUsers: waitingUsers.length,
    connectedPairs: Object.keys(connectedPairs).length / 2
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});