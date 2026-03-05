const { getFlights } = require("./flights");
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

  setInterval(async () => {
  try {

    const sats = getSatellites();
    io.emit("satellites", sats);

    const flights = await getFlights();
    io.emit("flights", flights);

  } catch (err) {
    console.error("Interval error:", err);
  }
}, 10000);
});
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 GCC Command Center running on port ${PORT}`);
});


