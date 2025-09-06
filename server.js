const { WebSocketServer } = require('ws');
const http = require('http');

// Ek basic HTTP server banayein, yeh Render ke health checks ke liye zaroori hai
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('TikTalk WebSocket Server is running');
});

const wss = new WebSocketServer({ server });

let waitingUser = null;

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Partner dhundne ka logic
  if (waitingUser) {
    const partner = waitingUser;
    waitingUser = null;

    // Dono ko ek doosre se jodein
    ws.partner = partner;
    partner.partner = ws;

    // Dono ko connection ka status bhejein
    partner.send(JSON.stringify({ type: 'system', text: 'connected' }));
    ws.send(JSON.stringify({ type: 'system', text: 'connected' }));

    // Pehle user ko offer create karne ke liye trigger bhejein
    partner.send(JSON.stringify({ type: 'system', text: 'initiate_offer' }));

    console.log('Users paired');
  } else {
    // Agar koi wait nahi kar raha, to is user ko waiting me daalein
    waitingUser = ws;
    ws.send(JSON.stringify({ type: 'system', text: 'waiting' }));
    console.log('User is waiting for a partner');
  }

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error('Invalid JSON received:', message);
      return;
    }

    // Message ko uske partner tak pahuchayein
    const partner = ws.partner;
    if (partner && partner.readyState === partner.OPEN) {
        // Sirf message, typing, aur WebRTC signals ko forward karein
        if (['message', 'typing', 'offer', 'answer', 'candidate'].includes(data.type)) {
             partner.send(JSON.stringify(data));
        }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    const partner = ws.partner;

    if (partner) {
      // Partner ko batayein ki user chala gaya
      partner.send(JSON.stringify({ type: 'system', text: 'disconnected' }));
      partner.partner = null; // Partner ka reference hata dein
    }

    // Agar disconnect hone wala user hi waiting me tha
    if (waitingUser === ws) {
      waitingUser = null;
      console.log('The waiting user has disconnected.');
    }
    
    ws.partner = null; // Apna reference bhi hata dein
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

const PORT = process.env.PORT || 10000; // Render apne aap PORT set karta hai
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
