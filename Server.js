const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }, // CORS आपके GitHub Pages URL के लिए
  pingTimeout: 60000, // रीकनेक्शन के लिए
  pingInterval: 25000
});

app.use(express.static('public')); // स्टेटिक फाइल्स, अगर जरूरी हो

let waitingUsers = []; // वेटिंग यूजर्स की लिस्ट
let pairedUsers = new Map(); // पेयर किए गए यूजर्स (socket.id -> { partnerId, username })

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('startChat', (data) => {
    const { username } = data;
    if (!username) {
      socket.emit('system', { text: '❌ Username required' });
      return;
    }

    waitingUsers.push({ id: socket.id, username });
    pairedUsers.set(socket.id, { username, partnerId: null });
    socket.emit('system', { text: '🔍 Searching for a stranger...' });

    if (waitingUsers.length >= 2) {
      const user1 = waitingUsers.shift();
      const user2 = waitingUsers.shift();

      const roomId = `${user1.id}-${user2.id}`.split('-').sort().join('-');
      io.sockets.sockets.get(user1.id).join(roomId);
      io.sockets.sockets.get(user2.id).join(roomId);

      pairedUsers.set(user1.id, { username: user1.username, partnerId: user2.id });
      pairedUsers.set(user2.id, { username: user2.username, partnerId: user1.id });

      io.to(roomId).emit('system', { text: '✅ Connected! Say Hi 👋' });
    }
  });

  socket.on('sendMessage', (data) => {
    const { message, username } = data;
    const user = pairedUsers.get(socket.id);
    if (user && user.partnerId) {
      const roomId = `${socket.id}-${user.partnerId}`.split('-').sort().join('-');
      io.to(roomId).emit('receiveMessage', { username, message });
    }
  });

  socket.on('typing', (data) => {
    const { username } = data;
    const user = pairedUsers.get(socket.id);
    if (user && user.partnerId) {
      const roomId = `${socket.id}-${user.partnerId}`.split('-').sort().join('-');
      socket.to(roomId).emit('typing', { username });
    }
  });

  socket.on('nextChat', () => {
    const user = pairedUsers.get(socket.id);
    if (user && user.partnerId) {
      const roomId = `${socket.id}-${user.partnerId}`.split('-').sort().join('-');
      io.to(roomId).emit('system', { text: `❌ ${user.username} disconnected` });
      io.sockets.sockets.get(user.partnerId)?.emit('system', { text: '🔍 Searching for a new stranger...' });
      pairedUsers.delete(user.partnerId);
    }
    waitingUsers = waitingUsers.filter(u => u.id !== socket.id);
    pairedUsers.delete(socket.id);
    socket.emit('system', { text: '🔍 Searching for a new stranger...' });
    waitingUsers.push({ id: socket.id, username: user.username });
    if (waitingUsers.length >= 2) {
      const user1 = waitingUsers.shift();
      const user2 = waitingUsers.shift();
      const roomId = `${user1.id}-${user2.id}`.split('-').sort().join('-');
      io.sockets.sockets.get(user1.id).join(roomId);
      io.sockets.sockets.get(user2.id).join(roomId);
      pairedUsers.set(user1.id, { username: user1.username, partnerId: user2.id });
      pairedUsers.set(user2.id, { username: user2.username, partnerId: user1.id });
      io.to(roomId).emit('system', { text: '✅ Connected! Say Hi 👋' });
    }
  });

  socket.on('disconnect', () => {
    const user = pairedUsers.get(socket.id);
    if (user && user.partnerId) {
      const roomId = `${socket.id}-${user.partnerId}`.split('-').sort().join('-');
      io.to(roomId).emit('system', { text: `❌ ${user.username} disconnected` });
      pairedUsers.delete(user.partnerId);
    }
    waitingUsers = waitingUsers.filter(u => u.id !== socket.id);
    pairedUsers.delete(socket.id);
    console.log(`User disconnected: ${socket.id}`);
  });

  socket.on('ping', () => {
    socket.emit('pong');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
