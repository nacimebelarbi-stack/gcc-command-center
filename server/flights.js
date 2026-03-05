const axios = require("axios");

const GCC = { minLat:16, maxLat:33, minLon:35, maxLon:60 };

async function getFlights() {
  try {
    const res = await axios.get("https://opensky-network.org/api/states/all");
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
        icao: s[0],
        callsign: s[1]?.trim(),
        lat: s[6],
        lon: s[5],
        altitude: s[7],
        velocity: s[9],
        heading: s[10]
      }));
  } catch {
    return [];
  }
}

module.exports = { getFlights };