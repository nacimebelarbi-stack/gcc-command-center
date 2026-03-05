const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const axios = require("axios");

const { getSatellites } = require("./satellites");

const app = express();
app.use(cors());
app.use(express.static("public"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  },
  transports: ["websocket"]
});

// GCC bounding box for flights
const GCC = {
  minLat: 16,
  maxLat: 33,
  minLon: 35,
  maxLon: 60
};

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
        callsign: s[1]?.trim() || "FLIGHT",
        lat: s[6],
        lon: s[5],
        altitude: s[7] || 10000
      }));

  } catch (err) {
    console.error("Flights fetch failed:", err.message);
    return [];
  }
}

io.on("connection", (socket) => {

  console.log("Client connected");

  // Emit satellites every 5 seconds
  setInterval(() => {
    const sats = getSatellites();
    console.log("Emitting satellites:", sats.length);
    socket.emit("satellites", sats);
  }, 5000);

  // Emit flights every 7 seconds
  setInterval(async () => {
    const flights = await getFlights();
    console.log("Emitting flights:", flights.length);
    socket.emit("flights", flights);
  }, 7000);

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 GCC Command Center running on port ${PORT}`);
});
