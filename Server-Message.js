const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;

const server = new WebSocket.Server({ port: PORT });

const rooms = {};

console.log("Server running");

server.on("connection", socket => {

    socket.room = null;

    socket.on("message", data => {
        let msg;

        try {
            msg = JSON.parse(data);
        } catch {
            return;
        }

        if (msg.type === "join") {

            socket.room = msg.room;

            if (!rooms[msg.room]) rooms[msg.room] = [];

            rooms[msg.room].push(socket);

        }

        if (msg.type === "message") {

            const room = msg.room;

            if (!rooms[room]) return;

            rooms[room].forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(msg.message);
                }
            });

        }

    });

});