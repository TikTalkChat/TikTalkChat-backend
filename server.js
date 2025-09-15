const { WebSocketServer } = require("ws");
const http = require("http");

// HTTP server for Render health check
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("ChatSy WebSocket Server is running");
});

const wss = new WebSocketServer({ server });

let waitingTextUsers = [];
let waitingVideoUsers = [];
const MATCHMAKING_TIMEOUT = 15000; // 15 sec

console.log("--- ChatSy Server Started ---");

function safeSend(ws, msg) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

// Pair users from waiting list
function pairUsers(ws, list, mode) {
  if (list.length > 0) {
    const partner = list.shift();

    // cleanup partner timeout
    if (partner.timeout) clearTimeout(partner.timeout);

    ws.partner = partner;
    partner.partner = ws;

    safeSend(ws, { type: "system", text: "connected" });
    safeSend(partner, { type: "system", text: "connected" });

    if (mode === "VIDEO") {
      safeSend(partner, { type: "system", text: "initiate_offer" });
    }
    console.log(`[SUCCESS] Paired 2 ${mode} users.`);
  } else {
    list.push(ws);
    safeSend(ws, { type: "system", text: "waiting" });

    ws.timeout = setTimeout(() => {
      const index = list.indexOf(ws);
      if (index !== -1) {
        list.splice(index, 1);
        safeSend(ws, { type: "system", text: "timeout" });
        console.log(`[TIMEOUT] ${mode} user removed after 15s.`);
      }
    }, MATCHMAKING_TIMEOUT);

    console.log(`[ACTION] No partner found. User added to ${mode} waiting list.`);
  }
}

wss.on("connection", (ws, req) => {
  const origin = req.headers.origin;

  // ✅ Security: only allow from your frontend
  if (origin !== "https://chatsychat.github.io") {
    console.warn(`[SECURITY] Blocked connection from: ${origin}`);
    ws.close();
    return;
  }

  console.log("[LOG] New client connected from:", origin);
  ws.msgCount = 0; // for spam protection

  ws.on("message", (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      safeSend(ws, { type: "error", text: "Invalid data format" });
      return;
    }

    // Spam protection: max 50 msgs/minute
    ws.msgCount++;
    if (ws.msgCount > 50) {
      console.warn("[SECURITY] Spam detected, closing connection.");
      ws.close();
      return;
    }

    // Mode change: matchmaking
    if (data.type === "mode_change") {
      ws.isVideo = data.video;
      console.log(`[LOG] User wants ${ws.isVideo ? "VIDEO" : "TEXT"} mode`);

      if (ws.isVideo) {
        pairUsers(ws, waitingVideoUsers, "VIDEO");
      } else {
        pairUsers(ws, waitingTextUsers, "TEXT");
      }
      return;
    }

    // Pass message to partner
    const partner = ws.partner;
    if (partner && partner.readyState === partner.OPEN) {
      if (["message", "typing", "offer", "answer", "candidate"].includes(data.type)) {
        partner.send(JSON.stringify(data));
      }
    }
  });

  ws.on("close", () => {
    console.log("[LOG] Client disconnected.");

    if (ws.timeout) clearTimeout(ws.timeout);

    const partner = ws.partner;
    if (partner) {
      safeSend(partner, { type: "system", text: "disconnected" });
      partner.partner = null;
    }

    // Remove from waiting lists if present
    [waitingTextUsers, waitingVideoUsers].forEach((list) => {
      const idx = list.indexOf(ws);
      if (idx !== -1) {
        list.splice(idx, 1);
      }
    });
  });

  ws.on("error", (error) => {
    console.error("[ERROR] WebSocket error:", error);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
