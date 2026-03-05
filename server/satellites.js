const axios = require("axios");
const satellite = require("satellite.js");

const GCC = { minLat:16, maxLat:33, minLon:35, maxLon:60 };

let tleData = [];

async function loadTLE() {
  const res = await axios.get(
    "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"
  );
  const lines = res.data.split("\n");
  tleData = [];
  for (let i = 0; i < lines.length; i += 3) {
    tleData.push({
      name: lines[i]?.trim(),
      line1: lines[i+1],
      line2: lines[i+2]
    });
  }
}
loadTLE();
setInterval(loadTLE, 3 * 60 * 60 * 1000);

function getSatellites(){
  const now = new Date();
  const gmst = satellite.gstime(now);

  return tleData.map(sat => {
    const satrec = satellite.twoline2satrec(sat.line1, sat.line2);
    const pos = satellite.propagate(satrec, now);
    if(!pos.position) return null;

    const geo = satellite.eciToGeodetic(pos.position, gmst);
    const lat = satellite.degreesLat(geo.latitude);
    const lon = satellite.degreesLong(geo.longitude);

    if(lat < GCC.minLat || lat > GCC.maxLat ||
       lon < GCC.minLon || lon > GCC.maxLon) return null;

    return {
      name: sat.name,
      lat,
      lon,
      altitude: geo.height * 1000
    };
  }).filter(Boolean);
}

module.exports = { getSatellites };