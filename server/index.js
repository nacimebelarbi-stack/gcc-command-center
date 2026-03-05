const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { getSatellites } = require("./satellites");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.static("public"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
  transports: ["websocket"]
});

const GCC = { minLat:16, maxLat:33, minLon:35, maxLon:60 };

async function getFlights() {
  try {
    const res = await axios.get(
      "https://opensky-network.org/api/states/all"
    );

    const states = res.data.states || [];

    return states
      .filter(s => {
        const lat = s[6];
        const lon = s[5];
        return lat && lon &&
          lat > GCC.minLat && lat < GCC.maxLat &&
          lon > GCC.minLon && lon < GCC.maxLon;
      })
      .map(s => ({
        callsign: s[1]?.trim(),
        lat: s[6],
        lon: s[5],
        altitude: s[7]
      }));

  } catch {
    return [];
  }
}

io.on("connection", (socket) => {
  console.log("Client connected");

  setInterval(async () => {
    socket.emit("satellites", getSatellites());
  }, 5000);

  setInterval(async () => {
    socket.emit("flights", await getFlights());
  }, 7000);
});

server.listen(process.env.PORT || 3000);
