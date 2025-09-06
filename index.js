const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const port = process.env.PORT || 3000;

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Store connected clients and their states
const clients = new Map(); // Map<ws, { id, pairedWith, videoEnabled }>

// Generate unique ID for clients
const generateId = () => Math.random().toString(36).substr(2, 9);

// Pair clients for chat
function pairClients(ws) {
  const unpaired = Array.from(clients.entries()).find(
    ([client, data]) => !data.pairedWith && client !== ws && client.readyState === WebSocket.OPEN
  );

  if (unpaired) {
    const [otherWs, otherData] = unpaired;
    clients.get(ws).pairedWith = otherData.id;
    otherData.pairedWith = clients.get(ws).id;
    ws.send(JSON.stringify({ type: 'system', text: 'connected' }));
    otherWs.send(JSON.stringify({ type: 'system', text: 'connected' }));

    // If both clients have video enabled, initiate WebRTC offer
    if (clients.get(ws).videoEnabled && otherData.videoEnabled) {
      ws.send(JSON.stringify({ type: 'system', text: 'initiate_offer' }));
    }
  } else {
    ws.send(JSON.stringify({ type: 'system', text: 'waiting' }));
    setTimeout(() => {
      if (clients.get(ws)?.pairedWith || ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({ type: 'system', text: 'timeout' }));
    }, 30000); // Timeout after 30 seconds
  }
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
  const clientId = generateId();
  clients.set(ws, { id: clientId, pairedWith: null, videoEnabled: false });

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error('Invalid JSON:', message);
      return;
    }

    const clientData = clients.get(ws);
    const pairedClient = Array.from(clients.entries()).find(
      ([client, data]) => data.id === clientData.pairedWith && client.readyState === WebSocket.OPEN
    );

    switch (data.type) {
      case 'mode_change':
        clientData.videoEnabled = data.video;
        if (pairedClient) {
          pairedClient[0].send(JSON.stringify({ type: 'mode_change', video: data.video }));
          if (clientData.videoEnabled && pairedClient[1].videoEnabled) {
            ws.send(JSON.stringify({ type: 'system', text: 'initiate_offer' }));
          }
        }
        break;

      case 'message':
        if (pairedClient) {
          pairedClient[0].send(JSON.stringify({ type: 'message', text: data.text }));
        }
        break;

      case 'typing':
        if (pairedClient) {
          pairedClient[0].send(JSON.stringify({ type: 'typing' }));
        }
        break;

      case 'offer':
        if (pairedClient) {
          pairedClient[0].send(JSON.stringify({ type: 'offer', offer: data.offer }));
        }
        break;

      case 'answer':
        if (pairedClient) {
          pairedClient[0].send(JSON.stringify({ type: 'answer', answer: data.answer }));
        }
        break;

      case 'candidate':
        if (pairedClient) {
          pairedClient[0].send(JSON.stringify({ type: 'candidate', candidate: data.candidate }));
        }
        break;
    }
  });

  ws.on('close', () => {
    const clientData = clients.get(ws);
    const pairedClient = Array.from(clients.entries()).find(
      ([client, data]) => data.id === clientData.pairedWith && client.readyState === WebSocket.OPEN
    );

    if (pairedClient) {
      pairedClient[0].send(JSON.stringify({ type: 'system', text: 'disconnected' }));
      pairedClient[1].pairedWith = null;
    }

    clients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });

  pairClients(ws);
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});