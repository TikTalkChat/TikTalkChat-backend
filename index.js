const WebSocket = require('ws');

// Create a WebSocket server on port 8080.
// Render.com will automatically use the correct port from the environment variable.
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

console.log('Server started...');

// These will hold users waiting for a partner.
let waitingTextUser = null;
let waitingVideoUser = null;

wss.on('connection', ws => {
    console.log('Client connected');
    ws.partner = null;

    ws.on('message', message => {
        try {
            const data = JSON.parse(message);

            // When a user wants to join the chat
            if (data.type === 'join') {
                console.log(`User wants to join ${data.mode} chat`);
                ws.mode = data.mode; // Store the mode ('text' or 'video')

                if (ws.mode === 'text') {
                    if (waitingTextUser) {
                        // Pair with the waiting user
                        pairUsers(ws, waitingTextUser);
                        waitingTextUser = null; // Clear the waiting spot
                    } else {
                        // No one is waiting, so this user has to wait
                        waitingTextUser = ws;
                        ws.send(JSON.stringify({ type: 'system', text: 'waiting' }));
                        console.log('User is waiting for a text partner.');
                    }
                } else if (ws.mode === 'video') {
                    if (waitingVideoUser) {
                        // Pair with the waiting user
                        pairUsers(ws, waitingVideoUser);
                        waitingVideoUser = null; // Clear the waiting spot
                    } else {
                        // No one is waiting, so this user has to wait
                        waitingVideoUser = ws;
                        ws.send(JSON.stringify({ type: 'system', text: 'waiting' }));
                        console.log('User is waiting for a video partner.');
                    }
                }
            }
            // For all other message types, just send them to the partner
            else if (ws.partner) {
                // Add the original message type to be forwarded
                data.type = data.type;
                ws.partner.send(JSON.stringify(data));
            }

        } catch (e) {
            console.error('Error processing message:', e);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        // If the disconnected user had a partner, notify them.
        if (ws.partner) {
            ws.partner.send(JSON.stringify({ type: 'system', text: 'disconnected' }));
            ws.partner.partner = null;
        }
        // If the disconnected user was waiting, remove them from the waiting queue.
        if (waitingTextUser === ws) {
            waitingTextUser = null;
            console.log('Waiting text user disconnected.');
        }
        if (waitingVideoUser === ws) {
            waitingVideoUser = null;
            console.log('Waiting video user disconnected.');
        }
    });
});

function pairUsers(ws1, ws2) {
    // Assign each user as the other's partner
    ws1.partner = ws2;
    ws2.partner = ws1;

    console.log('Users paired');
    
    // Notify both users that they are connected
    ws1.send(JSON.stringify({ type: 'system', text: 'connected' }));
    ws2.send(JSON.stringify({ type: 'system', text: 'connected' }));
}
