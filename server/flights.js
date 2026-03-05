const axios = require("axios");
const API_KEY = process.env.AVIATIONSTACK_KEY;
const GCC = {
  minLat: 16,
  maxLat: 33,
  minLon: 35,
  maxLon: 60
};

async function getFlights() {
  try {

    // OpenSky bounding box query
    const url = `https://opensky-network.org/api/states/all?lamin=${GCC.minLat}&lomin=${GCC.minLon}&lamax=${GCC.maxLat}&lomax=${GCC.maxLon}`;

    const res = await axios.get(url, {
      timeout: 30000
    });

    if (!res.data || !res.data.states) return [];

    const flights = res.data.states;

    const result = [];

    for (const f of flights) {

      const [
        icao,
        callsign,
        originCountry,
        timePosition,
        lastContact,
        lon,
        lat,
        baroAlt,
        onGround,
        velocity,
        heading,
        verticalRate,
        geoAlt
      ] = f;

      if (!lat || !lon) continue;
      if (onGround) continue;

      result.push({
        icao,
        callsign: (callsign || "").trim() || icao,
        lat,
        lon,
        altitude: (geoAlt || baroAlt || 0), // already meters
        heading: heading || 0,
        velocity: velocity || 0
      });
    }

    console.log("Flights over GCC:", result.length);

    return result;

  } catch (err) {
    console.error("Flight API error:", err.message);
    return []; // 🚨 NEVER throw
  }
}

module.exports = { getFlights };


