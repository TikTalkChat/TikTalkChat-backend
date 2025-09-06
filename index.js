// Load environment variables
require('dotenv').config();
const WebSocket = require('ws');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

// Configuration
const PORT = process.env.PORT || 8080;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store active users and waiting queue
const waitingQueue = []; // { id, ws, isVideo }
const activeConnections = new Map(); // Map<userId, { ws, isVideo, partnerId }>
const maxTimeout = 30000; // 30 seconds timeout for finding stranger

// Generate random user ID
function generateUserId() {
  return uuidv4().substring(0, 8);
}

// Send message to a specific user
function sendToUser(userId, message) {
  const user = activeConnections.get(userId);
  if (user && user.ws.readyState === WebSocket.OPEN) {
    user.ws.send(JSON.stringify(message));
  } else {
    console.warn(`Cannot send to user ${userId}: Not found or WebSocket closed`);
  }
}

// Pair two users from the waiting queue
function pairUsers() {
  if (waitingQueue.length < 2) return false;

  // Group users by video mode to prioritize matching
  const videoUsers = waitingQueue.filter(u => u.isVideo);
  const textUsers = waitingQueue.filter(u => !u.isVideo);

  // Try pairing video users first
  if (videoUsers.length >= 2) {
    const user1 = videoUsers.shift();
    const user2 = videoUsers.shift();
    waitingQueue.splice(waitingQueue.indexOf(user1), 1);
    waitingQueue.splice(waitingQueue.indexOf(user2), 1);
    pair(user1, user2);
    return true;
  }

  // Pair text users if available
  if (textUsers.length >= 2) {
    const user1 = textUsers.shift();
    const user2 = textUsers.shift();
    waitingQueue.splice(waitingQueue.indexOf(user1), 1);
    waitingQueue.splice(waitingQueue.indexOf(user2), 1);
    pair(user1, user2);
    return true;
  }

  return false;
}

// Pair two specific users
function pair(user1, user2) {
  activeConnections.get(user1.id).partnerId = user2.id;
  activeConnections.get(user2.id).partnerId = user1.id;

  // Notify both users
  sendToUser(user1.id, { type: 'system', text: 'connected' });
  sendToUser(user2.id, { type: 'system', text: 'connected' });

  // If both users are in video mode, initiate WebRTC offer
  if (user1.isVideo && user2.isVideo) {
    sendToUser(user1.id, { type: 'system', text: 'initiate_offer' });
  }

  console.log(`Paired users: ${user1.id} (video: ${user1.isVideo}) with ${user2.id} (video: ${user2.isVideo})`);
}

// Handle disconnection
function handleDisconnect(userId) {
  const user = activeConnections.get(userId);
  if (!user) return;

  const partnerId = user.partnerId;
  activeConnections.delete(userId);

  // Notify partner
  if (partnerId && activeConnections.has(partnerId)) {
    sendToUser(partnerId, { type: 'system', text: 'disconnected' });
    activeConnections.get(partnerId).partnerId = null;
  }

  // Remove from waiting queue
  const queueIndex = waitingQueue.findIndex(u => u.id === userId);
  if (queueIndex !== -1) {
    waitingQueue.splice(queueIndex, 1);
  }

  console.log(`User disconnected: ${userId}`);
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  const userId = generateUserId();
  const user = { ws, id: userId, isVideo: false, partnerId: null };
  activeConnections.set(userId, user);

  console.log(`New connection: ${userId}`);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      const type = message.type;

      switch (type) {
        case 'mode_change':
          user.isVideo = message.video;
          waitingQueue.push(user);
          sendToUser(userId, { type: 'system', text: 'waiting' });

          // Try pairing immediately
          if (!pairUsers()) {
            // Set timeout if no pair found
            setTimeout(() => {
              const stillWaiting = waitingQueue.find(u => u.id === userId);
              if (stillWaiting) {
                sendToUser(userId, { type: 'system', text: 'timeout' });
                waitingQueue.splice(waitingQueue.indexOf(stillWaiting), 1);
              }
            }, maxTimeout);
          }
          break;

        case 'message':
          if (user.partnerId) {
            sendToUser(user.partnerId, { type: 'message', text: message.text });
          }
          break;

        case 'typing':
          if (user.partnerId) {
            sendToUser(user.partnerId, { type: 'typing' });
          }
          break;

        case 'offer':
          if (user.partnerId && user.isVideo) {
            sendToUser(user.partnerId, { type: 'offer', offer: message.offer });
          }
          break;

        case 'answer':
          if (user.partnerId && user.isVideo) {
            sendToUser(user.partnerId, { type: 'answer', answer: message.answer });
          }
          break;

        case 'candidate':
          if (user.partnerId && user.isVideo) {
            sendToUser(user.partnerId, { type: 'candidate', candidate: message.candidate });
          }
          break;

        case 'next':
          handleDisconnect(userId);
          waitingQueue.push(user);
          sendToUser(userId, { type: 'system', text: 'waiting' });
          pairUsers();
          break;

        default:
          console.warn(`Unknown message type from ${userId}: ${type}`);
      }
    } catch (error) {
      console.error(`Error parsing message from ${userId}:`, error);
    }
  });

  ws.on('close', () => {
    handleDisconnect(userId);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${userId}:`, error);
    handleDisconnect(userId);
  });
});

// Health check endpoint for Render.com
server.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      connections: activeConnections.size,
      waiting: waitingQueue.length
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`TikTalk Signaling Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});