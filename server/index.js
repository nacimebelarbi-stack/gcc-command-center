const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const { getSatellites } = require("./satellites");

const app = express();
app.use(cors());

// Serve frontend correctly
app.use(express.static(__dirname + "/../public"));

// Force root route to index.html
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/../public/index.html");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
  transports: ["websocket"]
});

io.on("connection", (socket) => {
  console.log("Client connected");

  setInterval(() => {
    const sats = getSatellites();
    console.log("Emitting satellites:", sats.length);
    socket.emit("satellites", sats);
  }, 5000);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 GCC Command Center running on port ${PORT}`);
});
