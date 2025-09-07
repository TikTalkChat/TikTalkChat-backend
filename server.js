const { WebSocketServer } = require('ws');
const http = require('http');

// Ek basic HTTP server banayein, yeh Render ke health checks ke liye zaroori hai
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('TikTalk WebSocket Server is running');
});

const wss = new WebSocketServer({ server });

// Purane 'waitingUser' ko hatakar do alag user variables banayein
let waitingTextUser = null;
let waitingVideoUser = null;

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Partner dhundne ka logic ab 'message' event me shift ho gaya hai,
  // kyunki humein pehle user ka mode (text/video) janna zaroori hai.

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error('Invalid JSON received:', message);
      return;
    }

    // Pehle 'mode_change' message ko handle karein
    if (data.type === 'mode_change') {
      ws.isVideo = data.video; // User ka mode set karein
      console.log(`User mode set to: ${ws.isVideo ? 'video' : 'text'}`);

      let partner = null;

      if (ws.isVideo) {
        // --- VIDEO USER PAIRING LOGIC ---
        if (waitingVideoUser) {
          partner = waitingVideoUser;
          waitingVideoUser = null;
        } else {
          waitingVideoUser = ws;
        }
      } else {
        // --- TEXT USER PAIRING LOGIC ---
        if (waitingTextUser) {
          partner = waitingTextUser;
          waitingTextUser = null;
        } else {
          waitingTextUser = ws;
        }
      }

      if (partner) {
        // Agar partner mil gaya hai
        ws.partner = partner;
        partner.partner = ws;

        partner.send(JSON.stringify({ type: 'system', text: 'connected' }));
        ws.send(JSON.stringify({ type: 'system', text: 'connected' }));

        // Sirf video chat ke liye offer bhejein
        if (ws.isVideo) {
          partner.send(JSON.stringify({ type: 'system', text: 'initiate_offer' }));
        }

        console.log(`Users paired (${ws.isVideo ? 'video' : 'text'})`);
      } else {
        // Agar partner nahi mila, to waiting me daalein
        ws.send(JSON.stringify({ type: 'system', text: 'waiting' }));
        console.log(`User is waiting (${ws.isVideo ? 'video' : 'text'})`);
      }
      return; // 'mode_change' message ka kaam yahan khatm
    }

    // Baaki sabhi messages ko partner tak pahuchayein
    const partner = ws.partner;
    if (partner && partner.readyState === partner.OPEN) {
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

    // Agar disconnect hone wala user waiting me tha, to use waiting se hatayein
    if (waitingTextUser === ws) {
      waitingTextUser = null;
      console.log('The waiting text user has disconnected.');
    }
    if (waitingVideoUser === ws) {
      waitingVideoUser = null;
      console.log('The waiting video user has disconnected.');
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
