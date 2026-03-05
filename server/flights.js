const axios = require("axios");

const API_KEY = process.env.AVIATIONSTACK_KEY;
const BASE_URL = "http://api.aviationstack.com/v1/flights";

// Cache storage
let aircraft = [];
let lastFetchTime = 0;

// Minimum delay between AviationStack calls (in ms)
const FETCH_INTERVAL = 60000; // 60 seconds (increase if on free plan)

/**
 * Fetch real live aircraft positions from AviationStack
 */
async function fetchLiveFlights() {
  const now = Date.now();

  // If called too soon, return cached data
  if (now - lastFetchTime < FETCH_INTERVAL) {
    console.log("⏳ Serving cached flights");
    return aircraft;
  }

  try {
    if (!API_KEY) {
      console.error("❌ AVIATIONSTACK_KEY missing");
      return aircraft;
    }

    console.log("🌍 Fetching fresh flights from AviationStack...");

    const res = await axios.get(BASE_URL, {
      params: {
        access_key: API_KEY,
        flight_status: "active",
        limit: 100
      },
      timeout: 15000
    });

    if (!res.data || !Array.isArray(res.data.data)) {
      console.log("⚠️ No valid AviationStack data");
      return aircraft;
    }

    aircraft = res.data.data
      .filter(f =>
        f.live &&
        typeof f.live.latitude === "number" &&
        typeof f.live.longitude === "number"
      )
      .map(f => ({
        icao: f.flight?.icao || null,
        callsign: f.flight?.iata || f.flight?.icao || "UNKNOWN",
        airline: f.airline?.name || "Unknown Airline",
        route: `${f.departure?.iata || "XXX"} → ${f.arrival?.iata || "YYY"}`,
        latitude: f.live.latitude,
        longitude: f.live.longitude,
        altitude: f.live.altitude || 0,
        heading: f.live.direction || 0,
        speed_kmh: f.live.speed_horizontal || 0,
        vertical_speed: f.live.speed_vertical || 0,
        last_updated: f.live.updated || null
      }));

    lastFetchTime = now;

    console.log(`✈️ Live aircraft updated: ${aircraft.length}`);

    return aircraft;

  } catch (err) {
    console.error("❌ AviationStack fetch error:", err.message);
    return aircraft; // return cached data instead of empty array
  }
}

/**
 * Public function used by your app
 */
async function getFlights() {
  return await fetchLiveFlights();
}

module.exports = { getFlights };
