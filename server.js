const { WebSocketServer } = require('ws');
const http = require('http');

const server = http.createServer((req, res) => {
res.writeHead(200, { 'Content-Type': 'text/plain' });
res.end('TikTalk WebSocket Server is running');
});

const wss = new WebSocketServer({ server });

let waitingTextUser = null;
let waitingVideoUser = null;
const MATCHMAKING_TIMEOUT = 15000; // 15 सेकंड का टाइमआउट

console.log("--- Server started. Waiting lists are empty. ---");
console.log("--- Server started with Timeout logic. Waiting lists are empty. ---");

wss.on('connection', (ws) => {
console.log('[LOG] New client connected.');

ws.on('message', (message) => {
let data;
try {
data = JSON.parse(message);
} catch (e) {
console.error('[ERROR] Invalid JSON received:', message);
return;
}

if (data.type === 'mode_change') {
ws.isVideo = data.video;
console.log(`[LOG] Received mode_change. User wants: ${ws.isVideo ? 'VIDEO' : 'TEXT'}`);

let partner = null;

if (ws.isVideo) {
// --- VIDEO USER PAIRING LOGIC ---
        console.log('--- Entering VIDEO matchmaking ---');
        console.log(`[STATE] Is a video user waiting? ${!!waitingVideoUser}`);

if (waitingVideoUser) {
partner = waitingVideoUser;
          // पार्टनर के टाइमआउट को क्लियर करें क्योंकि वह अब पेयर्ड है
          if (partner.timeout) clearTimeout(partner.timeout);
waitingVideoUser = null;
          console.log('[SUCCESS] Paired two VIDEO users. Video waiting list is now empty.');
} else {
waitingVideoUser = ws;
          console.log('[ACTION] No video partner found. Putting this user into the VIDEO waiting list.');
          // === FIX: टाइमआउट शुरू करें ===
          ws.timeout = setTimeout(() => {
            if (waitingVideoUser === ws) { // अगर 15 सेकंड बाद भी यह यूज़र वेटिंग में है
              ws.send(JSON.stringify({ type: 'system', text: 'timeout' }));
              waitingVideoUser = null;
              console.log('[TIMEOUT] Video user timed out.');
            }
          }, MATCHMAKING_TIMEOUT);
}
} else {
// --- TEXT USER PAIRING LOGIC ---
        console.log('--- Entering TEXT matchmaking ---');
        console.log(`[STATE] Is a text user waiting? ${!!waitingTextUser}`);
        
if (waitingTextUser) {
partner = waitingTextUser;
          if (partner.timeout) clearTimeout(partner.timeout);
waitingTextUser = null;
          console.log('[SUCCESS] Paired two TEXT users. Text waiting list is now empty.');
} else {
waitingTextUser = ws;
          console.log('[ACTION] No text partner found. Putting this user into the TEXT waiting list.');
          // === FIX: टाइमआउट शुरू करें ===
          ws.timeout = setTimeout(() => {
            if (waitingTextUser === ws) {
              ws.send(JSON.stringify({ type: 'system', text: 'timeout' }));
              waitingTextUser = null;
              console.log('[TIMEOUT] Text user timed out.');
            }
          }, MATCHMAKING_TIMEOUT);
}
}

if (partner) {
ws.partner = partner;
partner.partner = ws;

partner.send(JSON.stringify({ type: 'system', text: 'connected' }));
ws.send(JSON.stringify({ type: 'system', text: 'connected' }));

if (ws.isVideo) {
partner.send(JSON.stringify({ type: 'system', text: 'initiate_offer' }));
}
} else {
ws.send(JSON.stringify({ type: 'system', text: 'waiting' }));
}
return;
}

const partner = ws.partner;
if (partner && partner.readyState === partner.OPEN) {
if (['message', 'typing', 'offer', 'answer', 'candidate'].includes(data.type)) {
partner.send(JSON.stringify(data));
}
}
});

ws.on('close', () => {
console.log('[LOG] Client disconnected.');
    // === FIX: टाइमआउट को क्लियर करें जब यूज़र डिस्कनेक्ट हो जाए ===
    if (ws.timeout) clearTimeout(ws.timeout);
    
const partner = ws.partner;

if (partner) {
partner.send(JSON.stringify({ type: 'system', text: 'disconnected' }));
partner.partner = null;
}

if (waitingTextUser === ws) {
waitingTextUser = null;
      console.log('[CLEANUP] The waiting TEXT user disconnected. List is now empty.');
}
if (waitingVideoUser === ws) {
waitingVideoUser = null;
      console.log('[CLEANUP] The waiting VIDEO user disconnected. List is now empty.');
}
    
ws.partner = null;
});

ws.on('error', (error) => {
console.error('[ERROR] WebSocket error:', error);
});
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
console.log(`Server is listening on port ${PORT}`);
});
