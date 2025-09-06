const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Store connected clients and their modes (chat or video)
const clients = new Map();
const waitingClients = { chat: [], video: [] };

function pairClients(mode) {
    const waiting = waitingClients[mode];
    if (waiting.length >= 2) {
        const client1 = waiting.shift();
        const client2 = waiting.shift();
        client1.partner = client2.ws;
        client2.partner = client1.ws;
        client1.ws.send(JSON.stringify({ type: 'system', text: 'connected' }));
        client2.ws.send(JSON.stringify({ type: 'system', text: 'connected' }));
        client1.ws.send(JSON.stringify({ type: 'system', text: 'initiate_offer' }));
    }
}

wss.on('connection', (ws) => {
    const clientId = Math.random().toString(36).substring(2);
    let clientMode = 'chat'; // Default mode

    clients.set(clientId, { ws, partner: null, mode: clientMode });

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            const client = clients.get(clientId);

            if (data.type === 'mode_change') {
                client.mode = data.video ? 'video' : 'chat';
                clientMode = client.mode;
                if (client.partner) {
                    client.partner.send(JSON.stringify({ type: 'system', text: 'disconnected' }));
                    client.partner = null;
                }
                if (!waitingClients[clientMode].some(c => c.id === clientId)) {
                    waitingClients[clientMode].push({ id: clientId, ws });
                    ws.send(JSON.stringify({ type: 'system', text: 'waiting' }));
                }
                pairClients(clientMode);
            } else if (data.type === 'message' && client.partner) {
                client.partner.send(JSON.stringify({ type: 'message', text: data.text }));
            } else if (data.type === 'typing' && client.partner) {
                client.partner.send(JSON.stringify({ type: 'typing' }));
            } else if (data.type === 'offer' && client.partner) {
                client.partner.send(JSON.stringify({ type: 'offer', offer: data.offer }));
            } else if (data.type === 'answer' && client.partner) {
                client.partner.send(JSON.stringify({ type: 'answer', answer: data.answer }));
            } else if (data.type === 'candidate' && client.partner) {
                client.partner.send(JSON.stringify({ type: 'candidate', candidate: data.candidate }));
            }
        } catch (err) {
            console.error('Error processing message:', err);
        }
    });

    ws.on('close', () => {
        const client = clients.get(clientId);
        if (client) {
            if (client.partner) {
                client.partner.send(JSON.stringify({ type: 'system', text: 'disconnected' }));
                client.partner = null;
            }
            waitingClients[client.mode] = waitingClients[client.mode].filter(c => c.id !== clientId);
            clients.delete(clientId);
        }
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });

    // Add client to waiting list for initial connection
    waitingClients[clientMode].push({ id: clientId, ws });
    ws.send(JSON.stringify({ type: 'system', text: 'waiting' }));
    pairClients(clientMode);
});

// Timeout for waiting clients
setInterval(() => {
    ['chat', 'video'].forEach(mode => {
        waitingClients[mode].forEach(client => {
            client.ws.send(JSON.stringify({ type: 'system', text: 'timeout' }));
        });
        waitingClients[mode] = [];
    });
}, 30000);

// Serve the index.html file for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});