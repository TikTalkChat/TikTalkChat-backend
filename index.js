const WebSocket = require('ws');
const http = require('http');

// Basic HTTP server for Render.com health check
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server with Video/Text support is running');
});

// WebSocket server
const wss = new WebSocket.Server({ server });

// Separate queues for text and video users
let waitingTextUser = null;
let waitingVideoUser = null;

// Timeout duration (30 seconds)
const WAITING_TIMEOUT = 30000; // in milliseconds

wss.on('connection', (ws, req) => {
    console.log('Client connected');

    // Security: Allow only specific origins (You can keep this as is)
    const origin = req.headers.origin;
    const allowedOrigins = ['https://tiktalkchat.github.io', 'http://localhost:3000', 'http://localhost:8000', null]; // Added null for local file testing
    if (!allowedOrigins.includes(origin)) {
        console.log(`Invalid origin, connection rejected: ${origin}`);
        ws.close(1008, 'Invalid Origin');
        return;
    }

    // Initialize properties for the user
    ws.createdAt = Date.now();
    ws.isVideo = false; // Default to text chat

    // Handle messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());

            // Handle mode selection and pairing
            if (data.type === 'mode_change') {
                ws.isVideo = !!data.video;
                console.log(`User mode set to video: ${ws.isVideo}`);
                
                // If user is already paired or waiting, ignore mode change for now
                if (ws.partner || waitingTextUser === ws || waitingVideoUser === ws) {
                    return;
                }

                if (ws.isVideo) {
                    // Try to pair with a waiting video user
                    if (waitingVideoUser && waitingVideoUser.readyState === WebSocket.OPEN) {
                        pairUsers(ws, waitingVideoUser);
                        waitingVideoUser = null;
                        // Tell the first user to initiate the call
                        ws.partner.send(JSON.stringify({ type: 'system', text: 'initiate_offer' }));
                    } else {
                        // Add to video waiting queue
                        waitingVideoUser = ws;
                        ws.send(JSON.stringify({ type: 'system', text: 'waiting' }));
                        console.log('User is waiting for a VIDEO partner.');
                    }
                } else {
                    // Try to pair with a waiting text user
                    if (waitingTextUser && waitingTextUser.readyState === WebSocket.OPEN) {
                        pairUsers(ws, waitingTextUser);
                        waitingTextUser = null;
                    } else {
                        // Add to text waiting queue
                        waitingTextUser = ws;
                        ws.send(JSON.stringify({ type: 'system', text: 'waiting' }));
                        console.log('User is waiting for a TEXT partner.');
                    }
                }
            } 
            // Relay other messages if paired
            else if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
                const allowedRelayTypes = ['message', 'typing', 'offer', 'answer', 'candidate'];
                if (allowedRelayTypes.includes(data.type)) {
                    ws.partner.send(JSON.stringify(data));
                }
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    // Handle disconnect
    ws.on('close', () => {
        console.log('Client disconnected');
        // Remove from waiting queues if they were waiting
        if (ws === waitingTextUser) {
            waitingTextUser = null;
            console.log('Waiting text user left.');
        }
        if (ws === waitingVideoUser) {
            waitingVideoUser = null;
            console.log('Waiting video user left.');
        }
        // Notify partner if they were in a chat
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

function pairUsers(user1, user2) {
    user1.partner = user2;
    user2.partner = user1;
    user1.send(JSON.stringify({ type: 'system', text: 'connected' }));
    user2.send(JSON.stringify({ type: 'system', text: 'connected' }));
    console.log(`Users paired! (Mode: ${user1.isVideo ? 'Video' : 'Text'})`);
}

// Timeout for waiting users (checks both queues)
setInterval(() => {
    if (waitingTextUser && Date.now() - waitingTextUser.createdAt > WAITING_TIMEOUT) {
        console.log('Waiting timeout for TEXT user');
        waitingTextUser.send(JSON.stringify({ type: 'system', text: 'timeout' }));
        waitingTextUser.close();
        waitingTextUser = null;
    }
    if (waitingVideoUser && Date.now() - waitingVideoUser.createdAt > WAITING_TIMEOUT) {
        console.log('Waiting timeout for VIDEO user');
        waitingVideoUser.send(JSON.stringify({ type: 'system', text: 'timeout' }));
        waitingVideoUser.close();
        waitingVideoUser = null;
    }
}, 5000); // Check every 5 seconds

// Start server on Render.com port
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
