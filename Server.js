const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

// Frontend URL yahan add karein
const FRONTEND_URL = 'https://tiktalkchat.github.io';

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL, // Sirf aapka frontend URL allow hoga
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Connection optimization settings
  pingTimeout: 60000,
  pingInterval: 25000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
});

// User pairing ke liye variables
const waitingUsers = [];
const connectedPairs = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // New user ko waiting list mein add karo
  waitingUsers.push(socket.id);
  socket.emit('system', { text: 'waiting' });
  
  // Do users available hone par unhe connect karo
  if (waitingUsers.length >= 2) {
    const user1 = waitingUsers.shift();
    const user2 = waitingUsers.shift();
    
    connectedPairs[user极速1] = user2;
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
  
  // Find stranger request handle karo
  socket.on('find-stranger', () => {
    // Pehle se waiting list mein nahi hai to add karo
    if (!waitingUsers.includes(socket.id)) {
      waitingUsers.push(socket.id);
    }
    socket.emit('system', { text: 'waiting' });
    
    // Try to pair immediately
    if (waitingUsers.length >= 2) {
      const user1 = waitingUsers.shift();
      const user2 = waitingUsers.shift();
      connectedPairs[user1极速] = user2;
      connectedPairs[user2] = user1;
      io.to(user1).emit('system', { text: 'connected' });
      io.to(user2).emit('system', { text: 'connected' });
    }
  });
  
  // Disconnect handle karo
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
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

// Health check endpoint for Render.com
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    waitingUsers: waitingUsers.length,
    connectedPairs: Object.keys(connectedPairs).length / 2,
    frontendUrl: FRONTEND_URL
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <h1>TikTalk Backend Server</h1>
    <p>Server is running properly</p>
    <p>Connected to frontend: ${FRONTEND_URL}</p>
    <p><a href="/health">Health Check</a></p>
  `);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
});