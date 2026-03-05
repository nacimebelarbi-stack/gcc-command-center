const axios = require("axios");
const satellite = require("satellite.js");

const GCC = {
  minLat: 16,
  maxLat: 33,
  minLon: 35,
  maxLon: 60
};

let tleData = [];

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

      // REMOVE STARLINK
      if (name.includes("STARLINK")) continue;

      // KEEP ONLY DEBRIS & ROCKET BODIES
      if (!name.includes("DEB") && !name.includes("R/B")) continue;

      tleData.push({ name, line1, line2 });
    }

    console.log("Filtered TLE count:", tleData.length);

  } catch (err) {
    console.error("TLE load failed:", err.message);
  }
}

loadTLE();
setInterval(loadTLE, 3 * 60 * 60 * 1000);

function getSatellites() {

  if (!tleData.length) return [];

  const now = new Date();
  const gmst = satellite.gstime(now);

  const result = [];

  for (const sat of tleData) {

    try {
      const satrec = satellite.twoline2satrec(sat.line1, sat.line2);
      const posVel = satellite.propagate(satrec, now);
      if (!posVel.position) continue;

      const geo = satellite.eciToGeodetic(posVel.position, gmst);

      const lat = satellite.degreesLat(geo.latitude);
      const lon = satellite.degreesLong(geo.longitude);

      // GCC FILTER
      if (
        lat < GCC.minLat || lat > GCC.maxLat ||
        lon < GCC.minLon || lon > GCC.maxLon
      ) continue;

      // ORBIT TRAIL (sample next 45 minutes)
      const orbit = [];
      for (let t = 0; t <= 45; t += 5) {
        const future = new Date(now.getTime() + t * 60000);
        const gmstFuture = satellite.gstime(future);
        const futurePos = satellite.propagate(satrec, future);
        if (!futurePos.position) continue;

        const futureGeo = satellite.eciToGeodetic(
          futurePos.position,
          gmstFuture
        );

        orbit.push([
          satellite.degreesLong(futureGeo.longitude),
          satellite.degreesLat(futureGeo.latitude),
          futureGeo.height * 1000
        ]);
      }

      result.push({
        name: sat.name,
        lat,
        lon,
        altitude: geo.height * 1000,
        orbit
      });

    } catch {
      continue;
    }
  }

  return result;
}

module.exports = { getSatellites };
