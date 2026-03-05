
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0M2ZlMDNlMS05YmQ3LTQ2MWUtYTA2NC1iZWY5N2IwNTc4NDQiLCJpZCI6Mzk4NDk4LCJpYXQiOjE3NzI3MDAxMzB9.dqusYhifXL6vnbTMlGlOI1nP7ycmZzP4fVEw8Ixa_Dc";

const socket = io({
  transports: ["websocket"]
});

const viewer = new Cesium.Viewer("cesiumContainer", {
  timeline: false,
  animation: false,
  baseLayerPicker: false,
  infoBox: true,
  selectionIndicator: true
});

// Focus on GCC
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(50, 25, 20000000)
});

const satEntities = {};
const flightEntities = {};

// ============================
// ICAO → Country Mapping
// ============================
function getCountryFromICAO(icao) {
  if (!icao) return "Unknown";

  if (icao.startsWith("A")) return "USA";
  if (icao.startsWith("4")) return "UK";
  if (icao.startsWith("39")) return "France";
  if (icao.startsWith("3C")) return "Germany";
  if (icao.startsWith("70")) return "UAE";
  if (icao.startsWith("71")) return "Saudi Arabia";
  if (icao.startsWith("06")) return "Qatar";

  return "Unknown";
}

// ============================
// SATELLITES
// ============================
socket.on("satellites", function(sats) {

  Object.values(satEntities).forEach(e =>
    viewer.entities.remove(e)
  );
  Object.keys(satEntities).forEach(k =>
    delete satEntities[k]
  );

  sats.forEach(s => {

    const orbitPositions = [];

    if (s.orbit) {
      s.orbit.forEach(p => {
        orbitPositions.push(
          Cesium.Cartesian3.fromDegrees(
            p[0], p[1], p[2]
          )
        );
      });
    }

    const entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(
        s.lon,
        s.lat,
        s.altitude
      ),
      point: {
        pixelSize: 6,
        color: Cesium.Color.RED
      },
      label: {
        text: s.name,
        font: "10px monospace",
        fillColor: Cesium.Color.YELLOW
      },
      polyline: {
        positions: orbitPositions,
        width: 1,
        material: Cesium.Color.ORANGE
      },
      name: s.name,
      description: `
        <div style="font-family: monospace">
          <b>Object:</b> ${s.name}<br/>
          <b>Latitude:</b> ${s.lat.toFixed(2)}°<br/>
          <b>Longitude:</b> ${s.lon.toFixed(2)}°<br/>
          <b>Altitude:</b> ${(s.altitude/1000).toFixed(2)} km<br/>
          <b>Type:</b> Satellite
        </div>
      `
    });

    satEntities[s.name] = entity;
  });
});

// ============================
// FLIGHTS (Browser Fetch)
// ============================
async function fetchFlights() {
  try {
    const res = await fetch("https://opensky-network.org/api/states/all");
    const data = await res.json();
    const states = data.states || [];

    const flights = states.filter(s => {
      const lat = s[6];
      const lon = s[5];

      return lat && lon &&
        lat > 16 && lat < 33 &&
        lon > 35 && lon < 60;
    });

    updateFlights(flights);

  } catch (err) {
    console.log("Flight fetch failed:", err);
  }
}

function updateFlights(flights) {

  flights.forEach(s => {

    const callsign = s[1]?.trim() || "FLIGHT";
    const icao = s[0];
    const lat = s[6];
    const lon = s[5];
    const altitude = s[7] || 10000;
    const heading = s[10] || 0;

    const country = getCountryFromICAO(icao);

    if (flightEntities[callsign]) {

      flightEntities[callsign].position =
        Cesium.Cartesian3.fromDegrees(lon, lat, altitude);

      flightEntities[callsign].billboard.rotation =
        Cesium.Math.toRadians(heading);

    } else {

      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(
          lon,
          lat,
          altitude
        ),
        billboard: {
          image: "https://cdn-icons-png.flaticon.com/512/34/34627.png",
          width: 18,
          height: 18,
          rotation: Cesium.Math.toRadians(heading),
          alignedAxis: Cesium.Cartesian3.UNIT_Z
        },
        label: {
          text: callsign,
          font: "10px monospace",
          fillColor: Cesium.Color.CYAN,
          pixelOffset: new Cesium.Cartesian2(0, -20)
        },
        name: callsign,
        description: `
          <div style="font-family: monospace">
            <b>Callsign:</b> ${callsign}<br/>
            <b>ICAO:</b> ${icao}<br/>
            <b>Country:</b> ${country}<br/>
            <b>Latitude:</b> ${lat.toFixed(2)}°<br/>
            <b>Longitude:</b> ${lon.toFixed(2)}°<br/>
            <b>Altitude:</b> ${(altitude/1000).toFixed(2)} km<br/>
            <b>Heading:</b> ${heading}°
          </div>
        `
      });

      flightEntities[callsign] = entity;
    }
  });
}

setInterval(fetchFlights, 10000);
fetchFlights();
