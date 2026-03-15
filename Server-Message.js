const WebSocket = require("ws");

// Use PORT from environment (Render sets this) or 8080 locally
const PORT = process.env.PORT || 8080;

const server = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server running on port ${PORT}`);

// Keep track of connected clients
server.on("connection", socket => {
  console.log("Client connected. Total clients:", server.clients.size);

  socket.on("message", message => {
    let msg = String(message); // convert everything to string
    msg = msg.replace(/[<>&\u0000-\u001F]/g, "").slice(0, 500); // sanitize

    // Broadcast to all connected clients
    server.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });

  socket.on("close", () => {
    console.log("Client disconnected. Total clients:", server.clients.size);
  });

  socket.on("error", err => {
    console.error("Socket error:", err);
  });
});
