// 1️⃣ Modules import
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// 2️⃣ Express app और HTTP server बनाना
const app = express();
const server = http.createServer(app);

// 3️⃣ Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*",       // किसी भी frontend से connect हो सके
    methods: ["GET", "POST"]
  }
});

// 4️⃣ Simple test route
app.get('/', (req, res) => {
  res.send('Chat server is running');
});

// 5️⃣ Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected');

  // Message receive और broadcast
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  // Disconnect log
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// 6️⃣ Port set करना
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));