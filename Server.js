const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Ya phir aapke frontend ka URL daalen
    methods: ['GET', 'POST']
  }
});

// User pairing ke liye variables
const waitingUsers = [];
const connectedPairs = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // New user ko waiting list mein add karo
  waitingUsers.push(socket.id);
  socket.emit('system', { text: 'waiting' });
  
  // Do users available hone par unhe connect karo
  if (waitingUsers.length >= 2) {
    const user1 = waitingUsers.shift();
    const user2 = waitingUsers.shift();
    
    connectedPairs[user1] = user2;
    connectedPairs[user2] = user1;
    
    // Dono users ko connected message bhejo
    io.to(user1).emit('system', { text: 'connected' });
    io.to(user2).emit('system', { text: 'connected' });
    
    console.log(`Paired ${user1} with ${user2}`);
  }
  
  // Messages handle karo
  socket.on('message', (data) => {
    try {
      // JSON string ko parse karo agar needed
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (parsedData.type === 'message') {
        // Message ko paired user tak pahunchao
        const partnerId = connectedPairs[socket.id];
        if (partnerId) {
          io.to(partnerId).emit('message', {
            type: 'message',
            text: parsedData.text
          });
        }
      } else if (parsedData.type === 'typing') {
        // Typing indicator paired user ko bhejo
        const partnerId = connectedPairs[socket.id];
        if (partnerId) {
          io.to(partnerId).emit('message', {
            type: 'typing'
          });
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
  
  // Disconnect handle karo
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    
    // Waiting list se remove karo
    const index = waitingUsers.indexOf(socket.id);
    if (index !== -1) {
      waitingUsers.splice(index, 1);
    }
    
    // Partner ko disconnect message bhejo
    const partnerId = connectedPairs[socket.id];
    if (partnerId) {
      io.to(partnerId).emit('system', { text: 'disconnected' });
      delete connectedPairs[partnerId];
      
      // Partner ko phir se waiting list mein daalo
      waitingUsers.push(partnerId);
      io.to(partnerId).emit('system', { text: 'waiting' });
    }
    
    delete connectedPairs[socket.id];
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    usersWaiting: waitingUsers.length,
    activePairs: Object.keys(connectedPairs).length / 2
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});