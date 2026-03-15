const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });
console.log(`Multi-room WebSocket server running on port ${PORT}`);

const rooms = {}; // roomName -> Set of sockets

wss.on("connection", socket => {
  socket.room = null;

  socket.on("message", data => {
    try {
      const msgObj = JSON.parse(data);

      // Handle room join
      if(msgObj.type === "join" && msgObj.room){
        const roomName = msgObj.room;
        socket.room = roomName;
        if(!rooms[roomName]) rooms[roomName] = new Set();
        rooms[roomName].add(socket);
        console.log(`Client joined room ${roomName}, total: ${rooms[roomName].size}`);
        return;
      }

      // Handle message
      if(msgObj.type === "message" && socket.room){
        const sanitized = String(msgObj.message).replace(/[<>&\u0000-\u001F]/g,"").slice(0,500);
        rooms[socket.room].forEach(client => {
          if(client.readyState === WebSocket.OPEN){
            client.send(JSON.stringify({ message: sanitized }));
          }
        });
      }

    } catch(e){
      console.error("Invalid message:", data);
    }
  });

  socket.on("close", () => {
    if(socket.room && rooms[socket.room]){
      rooms[socket.room].delete(socket);
      console.log(`Client left room ${socket.room}, total: ${rooms[socket.room].size}`);
    }
  });

  socket.on("error", err => {
    console.error("Socket error:", err);
  });
});
