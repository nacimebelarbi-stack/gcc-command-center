const axios = require("axios");
const satellite = require("satellite.js");

let tleData = [];

/*
  LOAD TLE SAFELY
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

    for (let i = 0; i < lines.length - 2; i += 3) {
      const name = lines[i];
      const line1 = lines[i + 1];
      const line2 = lines[i + 2];

      if (!line1 || !line2) continue;
      if (!line1.startsWith("1 ")) continue;
      if (!line2.startsWith("2 ")) continue;

      tleData.push({
        name,
        line1,
        line2
      });
    }

    console.log("Loaded TLE count:", tleData.length);

  } catch (err) {
    console.error("TLE load failed:", err.message);
  }
}

// Load immediately
loadTLE();

// Refresh every 3 hours
setInterval(loadTLE, 3 * 60 * 60 * 1000);

/*
  SAFE SATELLITE PROPAGATION
*/
function getSatellites() {

  if (!tleData || tleData.length === 0) {
    console.log("TLE not loaded yet");
    return [];
  }

  const now = new Date();
  const gmst = satellite.gstime(now);

  const result = [];

  for (const sat of tleData) {

    if (!sat.line1 || !sat.line2) continue;

    try {

      const satrec = satellite.twoline2satrec(
        sat.line1,
        sat.line2
      );

      const posVel = satellite.propagate(satrec, now);

      if (!posVel || !posVel.position) continue;

      const geo = satellite.eciToGeodetic(
        posVel.position,
        gmst
      );

      const lat = satellite.degreesLat(geo.latitude);
      const lon = satellite.degreesLong(geo.longitude);

      result.push({
        name: sat.name,
        lat,
        lon,
        altitude: geo.height * 1000
      });

    } catch (err) {
      continue; // skip any bad satellite safely
    }
  }

  console.log("Total satellites returned:", result.length);

  return result;
}

module.exports = { getSatellites };
