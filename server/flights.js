const axios = require("axios");

const GCC = {
  minLat: 16,
  maxLat: 33,
  minLon: 35,
  maxLon: 60
};

// ADS-B Exchange API (public read endpoint)
async function getFlights() {
  try {
    const res = await axios.get(
      "https://api.adsbexchange.com/v2/lat/16/lon/35/dist/1500/"
    );

    const aircraft = res.data.ac || [];

    const flights = aircraft
      .filter(a =>
        a.lat && a.lon &&
        a.lat > GCC.minLat && a.lat < GCC.maxLat &&
        a.lon > GCC.minLon && a.lon < GCC.maxLon
      )
      .map(a => ({
        callsign: a.flight || "FLIGHT",
        lat: a.lat,
        lon: a.lon,
        altitude: (a.alt_baro || 30000) * 0.3048,
        heading: a.track || 0
      }));

    console.log("Flights over GCC:", flights.length);

    return flights;

  } catch (err) {
    console.error("ADS-B fetch failed:", err.message);
    return [];
  }
}

module.exports = { getFlights };
