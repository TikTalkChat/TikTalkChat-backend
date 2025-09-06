const WebSocket = require('ws');
const http = require('http');

// Basic HTTP server for Render.com health check
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server is running');
});

// WebSocket server
const wss = new WebSocket.Server({ server });

let waitingUser = null;

// Timeout duration (30 seconds)
const WAITING_TIMEOUT = 30000; // in milliseconds

wss.on('connection', (ws, req) => {
    console.log('Client connected');

    // Security: Allow only specific origins
    const origin = req.headers.origin;
    const allowedOrigins = ['https://tiktalkchat.github.io', 'http://localhost:3000', 'http://localhost:8000'];
    if (!allowedOrigins.includes(origin)) {
        console.log(`Invalid origin, connection rejected: ${origin}`);
        ws.close(1008, 'Invalid Origin');
        return;
    }

    // Set creation time for timeout
    ws.createdAt = Date.now();
    ws.isAlive = true; // For future heartbeat (optional)

    // Pairing logic
    if (waitingUser && waitingUser.readyState === WebSocket.OPEN) {
        // Pair with waiting user
        ws.partner = waitingUser;
        waitingUser.partner = ws;
        waitingUser = null;

        // Notify both users
        ws.send(JSON.stringify({ type: 'system', text: 'connected' }));
        ws.partner.send(JSON.stringify({ type: 'system', text: 'connected' }));
        console.log('Users paired!');
    } else {
        // Add to waiting queue
        waitingUser = ws;
        ws.send(JSON.stringify({ type: 'system', text: 'waiting' }));
        console.log('User is waiting for a partner.');
    }

    // Handle messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            if (!['message', 'typing'].includes(data.type)) {
                console.warn('Invalid message type:', data);
                return;
            }
            if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
                ws.partner.send(JSON.stringify(data));
            } else if (ws.partner) {
                // Partner disconnected
                ws.send(JSON.stringify({ type: 'system', text: 'disconnected' }));
                ws.partner = null;
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    // Handle disconnect
    ws.on('close', () => {
        console.log('Client disconnected');
        if (ws === waitingUser) {
            waitingUser = null;
        }
        if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
            ws.partner.send(JSON.stringify({ type: 'system', text: 'disconnected' }));
            ws.partner.partner = null;
        }
    });

    // Handle errors
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        ws.close();
    });
});

// Timeout for waiting users
setInterval(() => {
    if (waitingUser && Date.now() - waitingUser.createdAt > WAITING_TIMEOUT) {
        console.log('Waiting timeout for user');
        waitingUser.send(JSON.stringify({ type: 'system', text: 'timeout' }));
        waitingUser.close();
        waitingUser = null;
    }
}, 10000); // Check every 10 seconds

// Start server on Render.com port
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});