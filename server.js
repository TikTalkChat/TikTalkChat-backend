const { WebSocketServer } = require('ws');
const http = require('http');

// एक सरल HTTP सर्वर बनाएँ जो Render.com को बताएगा कि सर्विस चालू है
const server = http.createServer((req, res) => {
  // अगर UptimeRobot या कोई और पिंग करता है, तो उसे 200 OK का जवाब दें
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('TikTalk WebSocket Server is running and healthy.');
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ server });

let waitingTextUser = null;
let waitingVideoUser = null;
const MATCHMAKING_TIMEOUT = 15000; // 15 सेकंड

console.log("--- Server started successfully. Waiting for connections... ---");

// जब भी कोई नया क्लाइंट कनेक्ट होता है
wss.on('connection', (ws) => {
  console.log('[EVENT] New client connected.');

  // जब क्लाइंट से कोई मैसेज आता है
  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error('[ERROR] Invalid JSON received from client.');
      return;
    }

    // === स्टेप 1: क्लाइंट का मोड (टेक्स्ट/वीडियो) सेट करें और मैचमेकिंग शुरू करें ===
    if (data.type === 'mode_change') {
      ws.isVideo = data.video;
      console.log(`[ACTION] Client set mode to: ${ws.isVideo ? 'VIDEO' : 'TEXT'}`);
      
      let waitingList = ws.isVideo ? 'video' : 'text';
      let partner = null;

      if (waitingList === 'video') {
        if (waitingVideoUser) {
          partner = waitingVideoUser;
          waitingVideoUser = null;
        } else {
          waitingVideoUser = ws;
        }
      } else { // text
        if (waitingTextUser) {
          partner = waitingTextUser;
          waitingTextUser = null;
        } else {
          waitingTextUser = ws;
        }
      }

      if (partner) {
        // पार्टनर मिल गया!
        console.log(`[ACTION] Match found! Pairing a ${waitingList} user.`);
        if (partner.timeout) clearTimeout(partner.timeout); // पार्टनर का टाइमआउट क्लियर करें
        
        ws.partner = partner;
        partner.partner = ws;

        // दोनों को 'connected' का मैसेज भेजें
        partner.send(JSON.stringify({ type: 'system', text: 'connected' }));
        ws.send(JSON.stringify({ type: 'system', text: 'connected' }));
        console.log("[SEND] Sent 'connected' to both users.");

        // अगर वीडियो चैट है, तो एक को ऑफर शुरू करने के लिए कहें
        if (ws.isVideo) {
          partner.send(JSON.stringify({ type: 'system', text: 'initiate_offer' }));
          console.log("[SEND] Sent 'initiate_offer' to the first user.");
        }
      } else {
        // पार्टनर नहीं मिला, वेटिंग लिस्ट में डालो
        console.log(`[ACTION] No partner found. Adding user to ${waitingList} waiting list.`);
        ws.send(JSON.stringify({ type: 'system', text: 'waiting' }));
        console.log("[SEND] Sent 'waiting' to the client.");
        
        // इस यूज़र के लिए टाइमआउट शुरू करें
        ws.timeout = setTimeout(() => {
          if ((ws.isVideo && waitingVideoUser === ws) || (!ws.isVideo && waitingTextUser === ws)) {
            ws.send(JSON.stringify({ type: 'system', text: 'timeout' }));
            console.log(`[TIMEOUT] A ${waitingList} user timed out.`);
            if (ws.isVideo) waitingVideoUser = null;
            else waitingTextUser = null;
          }
        }, MATCHMAKING_TIMEOUT);
      }
      return; // यह मैसेज हैंडल हो गया, आगे कुछ नहीं करना
    }

    // === स्टेप 2: अगर यूज़र पहले से पेयर्ड है, तो मैसेज पार्टनर को भेजें ===
    const partner = ws.partner;
    if (partner && partner.readyState === ws.OPEN) {
        // सिर्फ ज़रूरी मैसेज ही आगे भेजें
        if (['message', 'typing', 'offer', 'answer', 'candidate'].includes(data.type)) {
             partner.send(JSON.stringify(data));
        }
    }
  });

  // जब क्लाइंट डिस्कनेक्ट होता है
  ws.on('close', () => {
    console.log('[EVENT] Client disconnected.');
    if (ws.timeout) clearTimeout(ws.timeout); // अगर वेटिंग में था तो टाइमआउट हटा दें
    
    // अगर यूज़र पेयर्ड था, तो उसके पार्टनर को बताएं
    const partner = ws.partner;
    if (partner) {
      partner.send(JSON.stringify({ type: 'system', text: 'disconnected' }));
      console.log("[SEND] Sent 'disconnected' to the remaining partner.");
      partner.partner = null; // पार्टनर का लिंक हटा दें
    }

    // यूज़र को वेटिंग लिस्ट से भी हटा दें
    if (waitingTextUser === ws) {
      waitingTextUser = null;
      console.log('[ACTION] Removed user from text waiting list.');
    }
    if (waitingVideoUser === ws) {
      waitingVideoUser = null;
      console.log('[ACTION] Removed user from video waiting list.');
    }
    ws.partner = null;
  });

  // कोई एरर आने पर
  ws.on('error', (error) => {
    console.error('[ERROR] A WebSocket error occurred:', error);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
