const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } }); // CORS आपके GitHub Pages URL के लिए

app.use(express.static('public')); // स्टेटिक फाइल्स, अगर जरूरी हो

let waitingUsers = []; // वेटिंग यूजर्स की लिस्ट
let pairedUsers = new Map(); // पेयर किए गए यूजर्स (socket.id -> { partnerId, username })

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // यूजर चैट शुरू करता है
  socket.on('startChat', (data) => {
    const { username } = data;
    if (!username) {
      socket.emit('system', { text: '❌ Username required' });
      return;
    }

    // यूजर को वेटिंग लिस्ट में डालें
    waitingUsers.push({ id: socket.id, username });
    pairedUsers.set(socket.id, { username, partnerId: null });
    socket.emit('system', { text: '🔍 Searching for a stranger...' });

    // अगर 2 यूजर्स वेटिंग हैं, तो उन्हें पेयर करें
    if (waitingUsers.length >= 2) {
      const user1 = waitingUsers.shift();
      const user2 = waitingUsers.shift();

      // दोनों को एक रूम में जोड़ें
      const roomId = `${user1.id}-${user2.id}`;
      io.sockets.sockets.get(user1.id).join(roomId);
      io.sockets.sockets.get(user2.id).join(roomId);

      // पेयरिंग अपडेट करें
      pairedUsers.set(user1.id, { username: user1.username, partnerId: user2.id });
      pairedUsers.set(user2.id, { username: user2.username, partnerId: user1.id });

      // दोनों को कनेक्टेड नोटिफिकेशन भेजें
      io.to(roomId).emit('system', { text: '✅ Connected! Say Hi 👋' });
    }
  });

  // मैसेज भेजना
  socket.on('sendMessage', (data) => {
    const { message, username } = data;
    const user = pairedUsers.get(socket.id);
    if (user && user.partnerId) {
      const roomId = `${socket.id}-${user.partnerId}`.split('-').sort().join('-');
      io.to(roomId).emit('receiveMessage', { username, message });
    }
  });

  // टाइपिंग इंडिकेटर
  socket.on('typing', (data) => {
    const { username } = data;
    const user = pairedUsers.get(socket.id);
    if (user && user.partnerId) {
      const roomId = `${socket.id}-${user.partnerId}`.split('-').sort().join('-');
      socket.to(roomId).emit('typing', { username });
    }
  });

  // डिस्कनेक्ट
  socket.on('disconnect', () => {
    const user = pairedUsers.get(socket.id);
    if (user && user.partnerId) {
      const roomId = `${socket.id}-${user.partnerId}`.split('-').sort().join('-');
      io.to(roomId).emit('system', { text: `❌ ${user.username} disconnected` });
      pairedUsers.delete(user.partnerId);
    }
    waitingUsers = waitingUsers.filter(u => u.id !== socket.id);
    pairedUsers.delete(socket.id);
    console.log('User disconnected:', socket.id);
  });

  // पिंग-पोंग हार्टबीट
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});