const axios = require("axios");

const API_KEY = process.env.AVIATIONSTACK_KEY;
const BASE_URL = "http://api.aviationstack.com/v1/flights";

let aircraft = [];

/**
 * Fetch real live aircraft positions from AviationStack
 */
async function fetchLiveFlights() {
  try {
    if (!API_KEY) {
      console.error("❌ AVIATIONSTACK_KEY missing");
      return [];
    }

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
      return [];
    }

    const liveFlights = res.data.data
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
        
        // ✅ IMPORTANT: use lat / lon (not latitude / longitude)
        lat: f.live.latitude,
        lon: f.live.longitude,

        altitude: f.live.altitude || 0,
        heading: f.live.direction || 0,
        speed: f.live.speed_horizontal || 0,
        vertical_speed: f.live.speed_vertical || 0,
        last_updated: f.live.updated || null
      }));

    console.log(`✈️ Live aircraft received: ${liveFlights.length}`);

    return liveFlights;

  } catch (err) {
    console.error("❌ AviationStack fetch error:", err.message);
    return [];
  }
}

/**
 * Public function used by your app
 */
async function getFlights() {
  aircraft = await fetchLiveFlights();
  console.log("Flights emitted:", aircraft.length);
  return aircraft;
}

module.exports = { getFlights };
