import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const server = createServer(app);
const io = new Server(server);
const allusers = {};

// Get current directory name for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

// Expose 'public' directory to serve static files
app.use(express.static(join(__dirname, 'public')));

// Handle incoming HTTP requests
app.get("/", (req, res) => {
    console.log("GET Request");
    res.sendFile(join(__dirname, "app/index.html"));
});

// Handle socket connections
io.on("connection", (socket) => {
    console.log(`Someone connected to socket server and socket id is ${socket.id}`);

    socket.on("join-user", (username) => {
        console.log(`${username} joined socket connection`);
        allusers[username] = { username, id: socket.id };
        // Inform everyone that a new user joined
        io.emit("joined", allusers);
    });

    socket.on("offer", ({ from, to, offer }) => {
        console.log({ from, to, offer });
        io.to(allusers[to].id).emit("offer", { from, to, offer });
    });

    socket.on("answer", ({ from, to, answer }) => {
        io.to(allusers[from].id).emit("answer", { from, to, answer });
    });

    socket.on("end-call",({from, to}) =>{
        io.to(allusers[to].id).emit("end-call", {from,to});
    });


    socket.on("call-ended", caller =>{
        const [from, to]= caller;
        io.to(allusers[from].id).emit("call-ended", caller);
        io.to(allusers[to].id).emit("call-ended",caller);
    })

    socket.on("icecandidate", (candidate) => {
        console.log({ candidate });
        // Broadcast the ICE candidate to other peers
        socket.broadcast.emit("icecandidate", candidate);
    });
});

// Start the server on port 9000
server.listen(9000, () => {
    console.log(`Server listening on port 9000`);
});
