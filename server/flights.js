const axios = require("axios");

// GCC bounding box
const GCC = {
  minLat: 16,
  maxLat: 33,
  minLon: 35,
  maxLon: 60
};

async function getFlights() {
  try {

    const url = "https://public-api.adsbexchange.com/VirtualRadar/AircraftList.json";

    const response = await axios.get(url, {
      params: {
        latMin: GCC.minLat,
        latMax: GCC.maxLat,
        lonMin: GCC.minLon,
        lonMax: GCC.maxLon
      },
      timeout: 10000
    });

    if (!response.data || !Array.isArray(response.data.acList)) {
      console.log("ADSBx: No aircraft list returned");
      return [];
    }

    const flights = response.data.acList
      .filter(ac =>
        typeof ac.Lat === "number" &&
        typeof ac.Long === "number"
      )
      .map(ac => ({
        callsign: ac.Callsign?.trim() || ac.Reg || ac.Icao || "UNKNOWN",
        icao: ac.Icao || "",
        lat: ac.Lat,
        lon: ac.Long,
        altitude: ac.Alt ? ac.Alt * 0.3048 : 0, // feet → meters
        heading: ac.Track || 0
      }));

    console.log("ADSBx flights:", flights.length);

    return flights;

  } catch (error) {
    console.error("ADSBx fetch error:", error.message);
    return [];
  }
}

module.exports = { getFlights };
