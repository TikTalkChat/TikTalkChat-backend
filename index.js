// Load environment variables
require('dotenv').config();
const WebSocket = require('ws');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

// Configuration
const PORT = process.env.PORT || 8080;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Data structures
const waitingQueue = { text: [], video: [] }; // Separate queues for text and video users
const activeConnections = new Map(); // Map<userId, { ws, isVideo, partnerId, timeout }>
const MAX_TIMEOUT = 30000; // 30 seconds timeout for finding a stranger

// Generate random user ID
function generateUserId() {
  return uuidv4().substring(0, 8);
}

// Send message to a specific user
function sendToUser(userId, message) {
  const user = activeConnections.get(userId);
  if (user && user.ws.readyState === WebSocket.OPEN) {
    user.ws.send(JSON.stringify(message));
    console.log(`Sent to ${userId}:`, message);
  } else {
    console.warn(`Cannot send to ${userId}: Not found or WebSocket closed`);
  }
}

// Pair two users from the appropriate queue
function pairUsers() {
  // Pair video users
  if (waitingQueue.video.length >= 2) {
    const user1 = waitingQueue.video.shift();
    const user2 = waitingQueue.video.shift();
    pair(user1, user2);
    return true;
  }

  // Pair text users
  if (waitingQueue.text.length >= 2) {
    const user1 = waitingQueue.text.shift();
    const user2 = waitingQueue.text.shift();
    pair(user1, user2);
    return true;
  }

  return false;
}

// Pair two specific users
function pair(user1, user2) {
  // Clear any existing timeouts
  clearTimeout(user1.timeout);
  clearTimeout(user2.timeout);

  // Assign partners
  activeConnections.get(user1.id).partnerId = user2.id;
  activeConnections.get(user2.id).partnerId = user1.id;
  activeConnections.get(user1.id).timeout = null;
  activeConnections.get(user2.id).timeout = null;

  // Notify connection
  sendToUser(user1.id, { type: 'system', text: 'connected' });
  sendToUser(user2.id, { type: 'system', text: 'connected' });

  // Initiate WebRTC offer for video mode
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
  clearTimeout(user.timeout);
  activeConnections.delete(userId);

  // Notify partner
  if (partnerId && activeConnections.has(partnerId)) {
    sendToUser(partnerId, { type: 'system', text: 'disconnected' });
    activeConnections.get(partnerId).partnerId = null;
  }

  // Remove from waiting queue
  waitingQueue.text = waitingQueue.text.filter(u => u.id !== userId);
  waitingQueue.video = waitingQueue.video.filter(u => u.id !== userId);

  console.log(`User disconnected: ${userId}`);
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  const userId = generateUserId();
  const user = { ws, id: userId, isVideo: false, partnerId: null, timeout: null };
  activeConnections.set(userId, user);

  console.log(`New connection: ${userId}`);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      const type = message.type;

      switch (type) {
        case 'mode_change':
          user.isVideo = message.video;
          // Add to appropriate queue
          const queue = user.isVideo ? waitingQueue.video : waitingQueue.text;
          if (!queue.some(u => u.id === userId)) {
            queue.push(user);
            sendToUser(userId, { type: 'system', text: 'waiting' });

            // Set timeout for pairing
            user.timeout = setTimeout(() => {
              if (queue.some(u => u.id === userId)) {
                sendToUser(userId, { type: 'system', text: 'timeout' });
                queue.splice(queue.findIndex(u => u.id === userId), 1);
              }
            }, MAX_TIMEOUT);

            // Try pairing
            pairUsers();
          }
          break;

        case 'message':
          if (user.partnerId) {
            sendToUser(user.partnerId, { type: 'message', text: message.text });
          } else {
            console.warn(`No partner for ${userId} to send message`);
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
          } else {
            console.warn(`Invalid offer from ${userId}: No partner or not in video mode`);
          }
          break;

        case 'answer':
          if (user.partnerId && user.isVideo) {
            sendToUser(user.partnerId, { type: 'answer', answer: message.answer });
          } else {
            console.warn(`Invalid answer from ${userId}: No partner or not in video mode`);
          }
          break;

        case 'candidate':
          if (user.partnerId && user.isVideo) {
            sendToUser(user.partnerId, { type: 'candidate', candidate: message.candidate });
          } else {
            console.warn(`Invalid ICE candidate from ${userId}: No partner or not in video mode`);
          }
          break;

        case 'next':
          handleDisconnect(userId);
          const queue = user.isVideo ? waitingQueue.video : waitingQueue.text;
          queue.push(user);
          sendToUser(userId, { type: 'system', text: 'waiting' });

          user.timeout = setTimeout(() => {
            if (queue.some(u => u.id === userId)) {
              sendToUser(userId, { type: 'system', text: 'timeout' });
              queue.splice(queue.findIndex(u => u.id === userId), 1);
            }
          }, MAX_TIMEOUT);

          pairUsers();
          break;

        default:
          console.warn(`Unknown message type from ${userId}: ${type}`);
      }
    } catch (error) {
      console.error(`Error parsing message from ${userId}:`, error);
      sendToUser(userId, { type: 'system', text: 'error', error: 'Invalid message format' });
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
      waitingText: waitingQueue.text.length,
      waitingVideo: waitingQueue.video.length,
      timestamp: new Date().toISOString()
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

// Periodic cleanup for stale connections
setInterval(() => {
  for (const [userId, user] of activeConnections) {
    if (user.ws.readyState !== WebSocket.OPEN) {
      handleDisconnect(userId);
    }
  }
}, 60000); // Run every 60 seconds