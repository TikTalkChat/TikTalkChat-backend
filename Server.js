const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors'); // Added for CORS support

const app = express();
const server = http.createServer(app);

// Enable CORS for frontend (adjust origin as needed)
app.use(cors({
  origin: '*', // Replace with your frontend URL in production, e.g., 'https://your-frontend-domain.com'
  methods: ['GET'],
}));

// WebSocket server setup on /ws path
const wss = new WebSocket.Server({ server, path: '/ws' });

// Waiting queue for unmatched users
let waitingQueue = [];

// Active pairs: Map of ws connections (user1 -> user2, user2 -> user1)
let activePairs = new Map();

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', activeConnections: wss.clients.size });
});

// Basic route for root
app.get('/', (req, res) => {
  res.send('TikTalk Backend is running!');
});

wss.on('connection', (ws) => {
  console.log('New client connected:', ws._socket.remoteAddress);

  // Send waiting message initially
  ws.send(JSON.stringify({ type: 'system', text: 'waiting' }));

  // Add to waiting queue
  waitingQueue.push(ws);
  checkForMatch();

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message:', message);

      if (message.type === 'message') {
        // Forward message to paired user if exists
        const pairedWs = activePairs.get(ws);
        if (pairedWs && pairedWs.readyState === WebSocket.OPEN) {
          pairedWs.send(JSON.stringify({ type: 'message', text: message.text }));
        }
      } else if (message.type === 'typing') {
        // Forward typing indicator to paired user
        const pairedWs = activePairs.get(ws);
        if (pairedWs && pairedWs.readyState === WebSocket.OPEN) {
          pairedWs.send(JSON.stringify({ type: 'typing' }));
        }
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected:', ws._socket.remoteAddress);
    handleDisconnect(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    handleDisconnect(ws);
  });
});

// Function to check for match in waiting queue
function checkForMatch() {
  if (waitingQueue.length >= 2) {
    const user1 = waitingQueue.shift();
    const user2 = waitingQueue.shift();

    if (user1 && user2 && user1.readyState === WebSocket.OPEN && user2.readyState === WebSocket.OPEN) {
      // Create pair
      activePairs.set(user1, user2);
      activePairs.set(user2, user1);

      // Send connected message to both
      user1.send(JSON.stringify({ type: 'system', text: 'connected' }));
      user2.send(JSON.stringify({ type: 'system', text: 'connected' }));

      console.log('Paired two users');
    } else {
      // If connection closed, push back the valid one
      if (user1 && user1.readyState === WebSocket.OPEN) waitingQueue.push(user1);
      if (user2 && user2.readyState === WebSocket.OPEN) waitingQueue.push(user2);
      checkForMatch(); // Retry matching
    }
  }
}

// Handle disconnect: Notify pair and add back to queue if needed
function handleDisconnect(ws) {
  const pairedWs = activePairs.get(ws);
  if (pairedWs && pairedWs.readyState === WebSocket.OPEN) {
    // Notify paired user
    pairedWs.send(JSON.stringify({ type: 'system', text: 'disconnected' }));
    // Add paired user back to waiting queue
    waitingQueue.push(pairedWs);
    checkForMatch();
  }
  // Remove from active pairs and waiting queue
  activePairs.delete(ws);
  activePairs.delete(pairedWs);
  waitingQueue = waitingQueue.filter(w => w !== ws);
}

// Keep WebSocket connections alive with ping-pong
const pingInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log('Terminating inactive client:', ws._socket.remoteAddress);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000); // Ping every 30 seconds

wss.on('pong', (ws) => {
  ws.isAlive = true;
});

// Initialize isAlive for new connections
wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server...');
  wss.clients.forEach(ws => ws.close());
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});