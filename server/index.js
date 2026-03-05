const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { getFlights } = require("./flights");
const { getSatellites } = require("./satellites");

const app = express();
app.use(cors());
app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ["websocket", "polling"]
});

io.on("connection", (socket) => {
  console.log("Client connected");

  setInterval(async () => {
    const flights = await getFlights();
    socket.emit("flights", flights);
  }, 5000);

  setInterval(async () => {
    const sats = await getSatellites();
    socket.emit("satellites", sats);
  }, 3000);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`🚀 GCC Command Center running on port ${PORT}`)

);
