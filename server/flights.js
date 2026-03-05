const axios = require("axios");

const API_KEY = process.env.AVIATIONSTACK_KEY;
const BASE_URL = "http://api.aviationstack.com/v1/flights";

const GCC = {
  minLat: 16,
  maxLat: 33,
  minLon: 35,
  maxLon: 60
};

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

let aircraft = [];

async function initializeFlights() {
  try {

    if (!API_KEY) {
      console.error("AVIATIONSTACK_KEY missing");
      return;
    }

    const res = await axios.get(BASE_URL, {
      params: {
        access_key: API_KEY,
        limit: 20
      },
      timeout: 15000
    });

    if (!res.data || !Array.isArray(res.data.data)) {
      console.log("No AviationStack data");
      return;
    }

    aircraft = res.data.data.map((f, i) => ({
      icao: f.flight?.icao || "SIM" + i,
      callsign: f.flight?.iata || f.flight?.icao || "FLIGHT" + i,
      airline: f.airline?.name || "Unknown Airline",
      route: `${f.departure?.iata || "XXX"} → ${f.arrival?.iata || "YYY"}`,
      lat: randomBetween(GCC.minLat, GCC.maxLat),
      lon: randomBetween(GCC.minLon, GCC.maxLon),
      altitude: randomBetween(9000, 12000),
      heading: randomBetween(0, 360),
      speed: randomBetween(0.05, 0.12)
    }));

    console.log("Initialized aircraft:", aircraft.length);

  } catch (err) {
    console.error("Initialization error:", err.message);
  }
}

function moveAircraft() {
  aircraft = aircraft.map(f => {
    const rad = (f.heading * Math.PI) / 180;

    return {
      ...f,
      lat: f.lat + Math.cos(rad) * f.speed,
      lon: f.lon + Math.sin(rad) * f.speed
    };
  });
}

async function getFlights() {

  if (aircraft.length === 0) {
    await initializeFlights();
  }

  moveAircraft();

  console.log("Flights over GCC:", aircraft.length);

  return aircraft;
}

module.exports = { getFlights };
