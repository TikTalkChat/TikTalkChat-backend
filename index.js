const WebSocket = require('ws');
const http = require('http');

// Basic HTTP server for Render.com health check
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server is running');
});

// WebSocket server
const wss = new WebSocket.Server({ server });

let chatUsers = []; // चैट मोड के लिए यूजर पूल
let videoUsers = []; // वीडियो मोड के लिए यूजर पूल

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

    // Handle messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            // Validate message types
            if (!['mode', 'message', 'typing', 'offer', 'answer', 'ice-candidate'].includes(data.type)) {
                console.warn('Invalid message type:', data);
                return;
            }

            // Handle mode selection (chat or video)
            if (data.type === 'mode') {
                ws.mode = data.mode; // Store mode (chat or video)
                if (data.mode === 'video') {
                    videoUsers.push(ws);
                    console.log('User added to videoUsers queue');
                    matchUsers(videoUsers, 'video');
                } else {
                    chatUsers.push(ws);
                    console.log('User added to chatUsers queue');
                    matchUsers(chatUsers, 'chat');
                }
            }
            // Forward messages to partner
            else if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
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
        // Remove from appropriate queue
        if (ws.mode === 'video') {
            videoUsers = videoUsers.filter((u) => u !== ws);
        } else {
            chatUsers = chatUsers.filter((u) => u !== ws);
        }
        // Notify partner
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

// Pair users in the specified mode
function matchUsers(users, mode) {
    if (users.length >= 2) {
        const [user1, user2] = users.splice(0, 2);
        user1.partner = user2;
        user2.partner = user1;
        user1.send(JSON.stringify({ type: 'system', text: 'connected' }));
        user2.send(JSON.stringify({ type: 'system', text: 'connected' }));
        console.log(`Users paired in ${mode} mode!`);
    } else if (users.length === 1) {
        users[0].send(JSON.stringify({ type: 'system', text: 'waiting' }));
        console.log(`User is waiting for a partner in ${mode} mode.`);
    }
}

// Timeout for waiting users
setInterval(() => {
    const checkTimeout = (users, mode) => {
        users.forEach((user, index) => {
            if (Date.now() - user.createdAt > WAITING_TIMEOUT) {
                console.log(`Waiting timeout for user in ${mode} mode`);
                user.send(JSON.stringify({ type: 'system', text: 'timeout' }));
                user.close();
                users.splice(index, 1);
            }
        });
    };
    checkTimeout(chatUsers, 'chat');
    checkTimeout(videoUsers, 'video');
}, 10000); // Check every 10 seconds

// Start server on Render.com port
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});