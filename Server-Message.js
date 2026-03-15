const WebSocket = require("ws");

// Use PORT from environment or 8080 locally
const PORT = process.env.PORT || 8080;

const server = new WebSocket.Server({ port: PORT });
console.log(`Multi-room WebSocket server running on port ${PORT}`);

// Map: roomName -> Set of sockets
const rooms = {};

server.on("connection", socket => {
  socket.room = null;

  socket.on("message", data => {
    try {
      const msgObj = JSON.parse(data);

      // Handle join messages
      if(msgObj.type === "join") {
        const roomName = msgObj.room;
        socket.room = roomName;
        if(!rooms[roomName]) rooms[roomName] = new Set();
        rooms[roomName].add(socket);
        console.log(`Client joined room ${roomName}. Total: ${rooms[roomName].size}`);
        return;
      }

      // Handle chat/message broadcast
      if(msgObj.type === "message" && msgObj.room) {
        const roomName = msgObj.room;
        const sanitized = String(msgObj.message)
          .replace(/[<>&\u0000-\u001F]/g,"")
          .slice(0,500);

        if(rooms[roomName]){
          rooms[roomName].forEach(client => {
            if(client.readyState === WebSocket.OPEN){
              client.send(JSON.stringify({ message: sanitized }));
            }
          });
        }
      }

    } catch(e) {
      console.error("Invalid message:", data);
    }
  });

  socket.on("close", () => {
    if(socket.room && rooms[socket.room]){
      rooms[socket.room].delete(socket);
      console.log(`Client left room ${socket.room}. Total: ${rooms[socket.room].size}`);
    }
  });

  socket.on("error", err => {
    console.error("Socket error:", err);
  });
});
