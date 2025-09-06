const WebSocket = require('ws');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

// Configuration
const PORT = process.env.PORT || 8080;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store active users and waiting queue for stranger matching
const waitingQueue = []; // Users waiting to connect
const activeConnections = new Map(); // Map<userId, { ws, isVideo: bool, partnerId: string|null }>
const maxTimeout = 30000; // 30 seconds timeout for finding stranger

// Generate random ID for user
function generateUserId() {
  return uuidv4().substring(0, 8);
}

// Broadcast system message to a specific user
function sendToUser(userId, message) {
  const user = activeConnections.get(userId);
  if (user && user.ws.readyState === WebSocket.OPEN) {
    user.ws.send(JSON.stringify({ type: 'system', text: message }));
  }
}

// Pair two waiting users
function pairUsers() {
  if (waitingQueue.length >= 2) {
    const user1 = waitingQueue.shift();
    const user2 = waitingQueue.shift();
    
    // Assign partners
    activeConnections.get(user1.id).partnerId = user2.id;
    activeConnections.get(user2.id).partnerId = user1.id;
    
    // Notify connection
    sendToUser(user1.id, 'connected');
    sendToUser(user2.id, 'connected');
    
    console.log(`Paired users: ${user1.id} and ${user2.id}`);
    return true;
  }
  return false;
}

// Handle disconnection
function handleDisconnect(userId) {
  const user = activeConnections.get(userId);
  if (user) {
    const partnerId = user.partnerId;
    activeConnections.delete(userId);
    
    // Notify partner if connected
    if (partnerId) {
      sendToUser(partnerId, 'disconnected');
      activeConnections.get(partnerId).partnerId = null;
    }
    
    // Remove from waiting queue if present
    const queueIndex = waitingQueue.findIndex(u => u.id === userId);
    if (queueIndex !== -1) {
      waitingQueue.splice(queueIndex, 1);
    }
    
    console.log(`User disconnected: ${userId}`);
  }
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
        case 'join': // User starts searching
          if (!user.partnerId) {
            waitingQueue.push(user);
            sendToUser(userId, 'waiting');
            
            // Try to pair immediately
            if (!pairUsers()) {
              // Set timeout if no pair found
              setTimeout(() => {
                const stillWaiting = waitingQueue.find(u => u.id === userId);
                if (stillWaiting) {
                  sendToUser(userId, 'timeout');
                  waitingQueue.splice(waitingQueue.indexOf(stillWaiting), 1);
                }
              }, maxTimeout);
            }
          }
          break;
          
        case 'mode_change': // Switch to video mode
          user.isVideo = message.video;
          if (user.partnerId) {
            // Notify partner
            sendToUser(user.partnerId, JSON.stringify({ type: 'mode_change', video: message.video }));
          }
          break;
          
        case 'message': // Relay chat message
          if (user.partnerId) {
            sendToUser(user.partnerId, JSON.stringify({ type: 'message', text: message.text }));
          }
          break;
          
        case 'typing': // Typing indicator
          if (user.partnerId) {
            sendToUser(user.partnerId, JSON.stringify({ type: 'typing' }));
          }
          break;
          
        case 'offer': // WebRTC offer (video mode)
          if (user.partnerId && user.isVideo) {
            sendToUser(user.partnerId, JSON.stringify({ type: 'offer', offer: message.offer }));
          }
          break;
          
        case 'answer': // WebRTC answer
          if (user.partnerId && user.isVideo) {
            sendToUser(user.partnerId, JSON.stringify({ type: 'answer', answer: message.answer }));
          }
          break;
          
        case 'candidate': // ICE candidate
          if (user.partnerId && user.isVideo) {
            sendToUser(user.partnerId, JSON.stringify({ type: 'candidate', candidate: message.candidate }));
          }
          break;
          
        case 'next': // Next stranger
          handleDisconnect(userId);
          sendToUser(userId, 'waiting');
          waitingQueue.push(user);
          pairUsers();
          break;
      }
    } catch (error) {
      console.error('Invalid message:', error);
    }
  });
  
  ws.on('close', () => {
    handleDisconnect(userId);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    handleDisconnect(userId);
  });
});

// Health check endpoint for Render.com
server.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', connections: activeConnections.size }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`TikTalk Signaling Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});