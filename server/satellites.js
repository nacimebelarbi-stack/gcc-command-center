const axios = require("axios");
const satellite = require("satellite.js");

const GCC = {
  minLat: 16,
  maxLat: 33,
  minLon: 35,
  maxLon: 60
};

let tleData = [];

/*
  SAFELY LOAD TLE DATA
  - Removes blank lines
  - Skips incomplete TLE groups
  - Prevents satellite.js crash
*/
async function loadTLE() {
  try {
    const res = await axios.get(
      "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"
    );

    const lines = res.data
      .split("\n")
      .map(l => l.trim())
      .filter(l => l.length > 0);

    tleData = [];

    for (let i = 0; i < lines.length; i += 3) {
      if (!lines[i + 1] || !lines[i + 2]) continue;

      tleData.push({
        name: lines[i],
        line1: lines[i + 1],
        line2: lines[i + 2]
      });
    }

    console.log("Loaded TLE count:", tleData.length);
  } catch (err) {
    console.error("Failed to load TLE:", err.message);
  }
}

// Initial load
loadTLE();

// Refresh every 3 hours
setInterval(loadTLE, 3 * 60 * 60 * 1000);

/*
  GET SATELLITES (SAFE PROPAGATION)
  - Prevents crash if bad TLE slips through
  - Filters to GCC region
*/
function getSatellites() {
  const now = new Date();
  const gmst = satellite.gstime(now);

  const result = tleData.map(sat => {
    try {
      const satrec = satellite.twoline2satrec(sat.line1, sat.line2);
      const positionAndVelocity = satellite.propagate(satrec, now);

      if (!positionAndVelocity.position) return null;

      const geo = satellite.eciToGeodetic(
        positionAndVelocity.position,
        gmst
      );

      const lat = satellite.degreesLat(geo.latitude);
      const lon = satellite.degreesLong(geo.longitude);

      // Filter to GCC region
      if (
        lat < GCC.minLat || lat > GCC.maxLat ||
        lon < GCC.minLon || lon > GCC.maxLon
      ) {
        return null;
      }

      return {
        name: sat.name,
        lat,
        lon,
        altitude: geo.height * 1000
      };
    } catch (err) {
      return null;
    }
  }).filter(Boolean);

  console.log("Satellites over GCC:", result.length);

  return result;
}

module.exports = { getSatellites };
