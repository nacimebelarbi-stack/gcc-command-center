const axios = require("axios");

const API_KEY = process.env.AVIATIONSTACK_KEY;
const BASE_URL = "http://api.aviationstack.com/v1/flights";

const GCC = {
  minLat: 16,
  maxLat: 33,
  minLon: 35,
  maxLon: 60
};

async function getFlights() {
  try {

    if (!API_KEY) {
      console.error("AVIATIONSTACK_KEY missing");
      return [];
    }

    const res = await axios.get(BASE_URL, {
      params: {
        access_key: API_KEY,
        limit: 100
      },
      timeout: 15000
    });

    if (!res.data || !Array.isArray(res.data.data)) {
      console.log("No flight data returned");
      return [];
    }

    const flights = res.data.data
      .filter(f => {
        const lat = f.live?.latitude;
        const lon = f.live?.longitude;

        return typeof lat === "number" &&
               typeof lon === "number" &&
               lat >= GCC.minLat &&
               lat <= GCC.maxLat &&
               lon >= GCC.minLon &&
               lon <= GCC.maxLon;
      })
      .map(f => ({
        callsign: f.flight?.iata || f.flight?.icao || "N/A",
        icao: f.aircraft?.icao24 || "",
        lat: f.live.latitude,
        lon: f.live.longitude,
        altitude: f.live.altitude * 0.3048 || 10000, // feet → meters
        heading: f.live.direction || 0
      }));

    console.log("Flights over GCC:", flights.length);

    return flights;

  } catch (err) {
    console.error("AviationStack error:", err.message);
    return [];
  }
}

module.exports = { getFlights };
