const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" },
  pingTimeout: 60000,
  pingInterval: 25000
});

// टेस्ट रूट: सर्वर स्टेटस चेक करने के लिए
app.get('/', (req, res) => {
  res.send('TikTalk Server is Running!');
});

app.use(express.static('public'));

let waitingUsers = [];
let pairedUsers = new Map();

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
    console.log(`User ${username} waiting for match`);

    if (waitingUsers.length >= 2) {
      const user1 = waitingUsers.shift();
      const user2 = waitingUsers.shift();

      const roomId = `${user1.id}-${user2.id}`.split('-').sort().join('-');
      socket.to(user1.id).join(roomId);  // फिक्स: io.sockets.sockets.get() की बजाय socket.to() यूज
      socket.to(user2.id).join(roomId);

      pairedUsers.set(user1.id, { username: user1.username, partnerId: user2.id });
      pairedUsers.set(user2.id, { username: user2.username, partnerId: user1.id });

      io.to(roomId).emit('system', { text: '✅ Connected! Say Hi 👋' });
      console.log(`Paired users: ${user1.username} and ${user2.username}`);
    }
  });

  socket.on('sendMessage', (data) => {
    const { message, username } = data;
    const user = pairedUsers.get(socket.id);
    if (user && user.partnerId) {
      const roomId = `${socket.id}-${user.partnerId}`.split('-').sort().join('-');
      io.to(roomId).emit('receiveMessage', { username, message });
      console.log(`Message from ${username}: ${message}`);
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
      pairedUsers.delete(user.partnerId);
    }
    waitingUsers = waitingUsers.filter(u => u.id !== socket.id);
    pairedUsers.delete(socket.id);
    socket.emit('system', { text: '🔍 Searching for a new stranger...' });
    if (user) {
      waitingUsers.push({ id: socket.id, username: user.username });
    }
    // पेयरिंग दोहराएं
    if (waitingUsers.length >= 2) {
      const user1 = waitingUsers.shift();
      const user2 = waitingUsers.shift();
      const roomId = `${user1.id}-${user2.id}`.split('-').sort().join('-');
      socket.to(user1.id).join(roomId);
      socket.to(user2.id).join(roomId);
      pairedUsers.set(user1.id, { username: user1.username, partnerId: user2.id });
      pairedUsers.set(user2.id, { username: user2.username, partnerId: user1.id });
      io.to(roomId).emit('system', { text: '✅ Connected! Say Hi 👋' });
    }
    console.log(`Next chat requested by ${user ? user.username : 'Unknown'}`);
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