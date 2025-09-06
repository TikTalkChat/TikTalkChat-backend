const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'TikTalk Backend is running' });
});

// Store clients, waiting lists, and connected pairs
const clients = new Map(); // ws -> { id, mode }
const waitingClients = { text: [], video: [] }; // mode -> [{ ws, id }]
const connectedPairs = new Map(); // clientId -> { ws, mode, partnerId }

// WebSocket connection handler
wss.on('connection', (ws) => {
  const clientId = uuidv4(); // Generate unique client ID
  clients.set(ws, { id: clientId, mode: 'text' }); // Default mode: text
  console.log(`Client ${clientId} connected`);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const client = clients.get(ws);

      switch (data.type) {
        case 'mode_change':
          // Update client mode (text or video)
          client.mode = data.video ? 'video' : 'text';
          console.log(`Client ${clientId} switched to ${client.mode} mode`);

          // If already paired, notify partner
          const pair = connectedPairs.get(clientId);
          if (pair) {
            const partnerWs = getPartnerWs(pair.partnerId);
            if (partnerWs && partnerWs.readyState === WebSocket.OPEN) {
              partnerWs.send(JSON.stringify({ type: 'mode_change', video: data.video }));
            }
            // Remove from pair and re-add to waiting list
            disconnectPair(clientId);
          }
          addToWaitingList(ws, client.mode);
          break;

        case 'message':
          // Forward message to paired client
          const pairMsg = connectedPairs.get(clientId);
          if (pairMsg && pairMsg.ws.readyState === WebSocket.OPEN) {
            pairMsg.ws.send(JSON.stringify({ type: 'message', text: data.text }));
          }
          break;

        case 'typing':
          // Forward typing indicator to paired client
          const pairTyping = connectedPairs.get(clientId);
          if (pairTyping && pairTyping.ws.readyState === WebSocket.OPEN) {
            pairTyping.ws.send(JSON.stringify({ type: 'typing' }));
          }
          break;

        case 'offer':
        case 'answer':
        case 'candidate':
          // Forward WebRTC signaling messages
          const pairWebRTC = connectedPairs.get(clientId);
          if (pairWebRTC && pairWebRTC.ws.readyState === WebSocket.OPEN) {
            pairWebRTC.ws.send(JSON.stringify(data));
          }
          break;

        default:
          console.warn(`Unknown message type: ${data.type}`);
      }
    } catch (err) {
      console.error(`Error parsing message for client ${clientId}:`, err);
    }
  });

  ws.on('close', () => {
    console.log(`Client ${clientId} disconnected`);
    handleDisconnect(ws, clientId);
  });

  ws.on('error', (err) => {
    console.error(`WebSocket error for client ${clientId}:`, err);
    handleDisconnect(ws, clientId);
  });

  // Add client to waiting list
  addToWaitingList(ws, clients.get(ws).mode);
});

// Helper: Get WebSocket of a client by ID
function getPartnerWs(partnerId) {
  for (let [ws, client] of clients) {
    if (client.id === partnerId && ws.readyState === WebSocket.OPEN) {
      return ws;
    }
  }
  return null;
}

// Add client to waiting list and attempt pairing
function addToWaitingList(ws, mode) {
  const clientId = clients.get(ws).id;
  waitingClients[mode].push({ ws, id: clientId });
  console.log(`Client ${clientId} added to ${mode} waiting list`);

  // Try to pair if enough clients are waiting
  if (waitingClients[mode].length >= 2) {
    const client1 = waitingClients[mode].shift();
    const client2 = waitingClients[mode].shift();

    // Pair the clients
    connectedPairs.set(client1.id, { ws: client2.ws, mode, partnerId: client2.id });
    connectedPairs.set(client2.id, { ws: client1.ws, mode, partnerId: client1.id });

    // Notify both clients
    if (client1.ws.readyState === WebSocket.OPEN) {
      client1.ws.send(JSON.stringify({ type: 'system', text: 'connected' }));
      if (mode === 'video') {
        client1.ws.send(JSON.stringify({ type: 'system', text: 'initiate_offer' }));
      }
    }
    if (client2.ws.readyState === WebSocket.OPEN) {
      client2.ws.send(JSON.stringify({ type: 'system', text: 'connected' }));
    }

    console.log(`Paired clients ${client1.id} and ${client2.id} in ${mode} mode`);
  } else {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'system', text: 'waiting' }));
    }
  }
}

// Handle client disconnection
function handleDisconnect(ws, clientId) {
  // Remove from waiting lists
  waitingClients.text = waitingClients.text.filter((client) => client.id !== clientId);
  waitingClients.video = waitingClients.video.filter((client) => client.id !== clientId);

  // Notify paired client
  const pair = connectedPairs.get(clientId);
  if (pair && pair.ws.readyState === WebSocket.OPEN) {
    pair.ws.send(JSON.stringify({ type: 'system', text: 'disconnected' }));
    connectedPairs.delete(pair.partnerId); // Remove partner's entry
  }

  // Clean up
  connectedPairs.delete(clientId);
  clients.delete(ws);
}

// Disconnect a pair (e.g., on mode change)
function disconnectPair(clientId) {
  const pair = connectedPairs.get(clientId);
  if (pair && pair.ws.readyState === WebSocket.OPEN) {
    pair.ws.send(JSON.stringify({ type: 'system', text: 'disconnected' }));
    connectedPairs.delete(pair.partnerId);
  }
  connectedPairs.delete(clientId);
}

// Timeout waiting clients after 30 seconds
setInterval(() => {
  ['text', 'video'].forEach((mode) => {
    waitingClients[mode].forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({ type: 'system', text: 'timeout' }));
        client.ws.close();
      }
    });
    waitingClients[mode] = [];
  });
}, 30000);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`TikTalk Backend running on port ${PORT}`);
});