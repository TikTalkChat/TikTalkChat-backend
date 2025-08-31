const WebSocket = require('ws');
const http = require('http');

// एक बेसिक HTTP सर्वर बनाएं (Render.com पर हेल्थ चेक के लिए ज़रूरी है)
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server is running');
});

// WebSocket सर्वर बनाएं
const wss = new WebSocket.Server({ server });

let waitingUser = null;

wss.on('connection', (ws, req) => {
    console.log('Client connected');

    // सुरक्षा के लिए: केवल आपके Frontend URL से कनेक्शन स्वीकार करें
    const origin = req.headers.origin;
    if (origin !== 'https://tiktalkchat.github.io') {
        console.log(`Invalid origin, connection rejected: ${origin}`);
        ws.close(1008, "Invalid Origin");
        return;
    }

    // यूज़र्स को जोड़ने का लॉजिक
    if (waitingUser) {
        // अगर कोई यूज़र इंतज़ार कर रहा है, तो उसे इसके साथ जोड़ दें
        ws.partner = waitingUser;
        waitingUser.partner = ws;
        waitingUser = null;

        // दोनों यूज़र्स को बताएं कि वे कनेक्ट हो गए हैं
        ws.partner.send(JSON.stringify({ type: 'system', text: 'connected' }));
        ws.send(JSON.stringify({ type: 'system', text: 'connected' }));
        console.log('Users paired!');
    } else {
        // अगर कोई इंतज़ार नहीं कर रहा, तो इस यूज़र को इंतज़ार में रखें
        waitingUser = ws;
        ws.send(JSON.stringify({ type: 'system', text: 'waiting' }));
        console.log('User is waiting for a partner.');
    }

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            // संदेश को पार्टनर को भेजें
            if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
                ws.partner.send(JSON.stringify(data));
            }
        } catch (error) {
            console.error('Invalid message format:', message);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        // अगर यूज़र का कोई पार्टनर था
        if (ws.partner) {
            // पार्टनर को बताएं कि दूसरा यूज़र चला गया
            if (ws.partner.readyState === WebSocket.OPEN) {
                ws.partner.send(JSON.stringify({ type: 'system', text: 'disconnected' }));
            }
            ws.partner.partner = null; // पार्टनर का लिंक हटा दें
        }
        // अगर यह यूज़र इंतज़ार कर रहा था
        if (waitingUser === ws) {
            waitingUser = null;
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Render.com द्वारा दिए गए पोर्ट पर सर्वर शुरू करें
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
