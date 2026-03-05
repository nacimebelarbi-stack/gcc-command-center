console.log("flights.js loaded");
const axios = require("axios");

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

    const flights = states
      .filter(s => {
        const lat = s[6];
        const lon = s[5];

        return lat && lon &&
          lat > GCC.minLat && lat < GCC.maxLat &&
          lon > GCC.minLon && lon < GCC.maxLon;
      })
      .map(s => ({
        callsign: s[1]?.trim() || "FLIGHT",
        icao: s[0],
        lat: s[6],
        lon: s[5],
        altitude: s[7] || 10000,
        heading: s[10] || 0
      }));

    console.log("Flights over GCC:", flights.length);

    return flights;

    } catch (err) {
    console.error("OpenSky FULL ERROR:");
    console.error(err);
    return [];
  }
module.exports = { getFlights };



