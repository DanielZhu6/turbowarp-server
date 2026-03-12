const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
const server = new WebSocket.Server({ port: PORT });

// Structure: rooms[roomName] = { password: string|null, clients: [], lastMessage: "" }
const rooms = {};

// Initialize 3 public rooms
const publicRoomNames = ["Public-1", "Public-2", "Public-3"];
publicRoomNames.forEach(name => {
    rooms[name] = { password: null, clients: [], lastMessage: "" };
});

console.log(`Server running on port ${PORT}`);

server.on("connection", (socket) => {
    socket.id = Math.random().toString(36).substr(2, 9); // unique player id
    socket.room = null;

    socket.on("message", (data) => {
        let msg;
        try { msg = JSON.parse(data); } catch { return; }

        // Join a room with optional password
        if (msg.type === "join") {
            const roomName = msg.room;
            const pass = msg.password || null;

            if (!rooms[roomName]) {
                // Create private room if password provided
                if (!pass) {
                    socket.send(JSON.stringify({ error: "Room does not exist." }));
                    return;
                }
                rooms[roomName] = { password: pass, clients: [], lastMessage: "" };
            } else if (rooms[roomName].password && rooms[roomName].password !== pass) {
                socket.send(JSON.stringify({ error: "Incorrect password." }));
                return;
            }

            socket.room = roomName;
            rooms[roomName].clients.push(socket);

            // Send last message of room to new player
            if (rooms[roomName].lastMessage) {
                socket.send(JSON.stringify({ from: "server", message: rooms[roomName].lastMessage }));
            }
            return;
        }

        // Send message
        if (msg.type === "message") {
            const room = msg.room;
            if (!rooms[room]) return;

            rooms[room].lastMessage = msg.message;

            rooms[room].clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ from: socket.id, message: msg.message }));
                }
            });
        }
    });

    // Remove from room on disconnect
    socket.on("close", () => {
        if (socket.room && rooms[socket.room]) {
            rooms[socket.room].clients = rooms[socket.room].clients.filter(c => c !== socket);
            if (rooms[socket.room].clients.length === 0 && rooms[socket.room].password) {
                // Delete empty private rooms
                delete rooms[socket.room];
            }
        }
    });
});
