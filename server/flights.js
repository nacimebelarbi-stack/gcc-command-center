const axios = require("axios");

const GCC = {
  minLat: 16,
  maxLat: 33,
  minLon: 35,
  maxLon: 60
};

const API_KEY = "ec2e34699b7718842f5770c381ff426f";

async function getFlights() {
  try {

    const res = await axios.get(
      `http://api.aviationstack.com/v1/flights?access_key=${API_KEY}`
    );

    const flights = res.data.data
      .filter(f =>
        f.live &&
        f.live.latitude &&
        f.live.longitude &&
        f.live.latitude > GCC.minLat &&
        f.live.latitude < GCC.maxLat &&
        f.live.longitude > GCC.minLon &&
        f.live.longitude < GCC.maxLon
      )
      .map(f => ({
        callsign: f.flight.iata || f.flight.icao || "FLIGHT",
        lat: f.live.latitude,
        lon: f.live.longitude,
        altitude: f.live.altitude * 1000,
        heading: f.live.direction || 0
      }));

    console.log("Flights over GCC:", flights.length);

    return flights;

  } catch (err) {
    console.log("Flights API failed");
    return [];
  }
}

module.exports = { getFlights };
