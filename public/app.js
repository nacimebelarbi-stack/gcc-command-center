
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0M2ZlMDNlMS05YmQ3LTQ2MWUtYTA2NC1iZWY5N2IwNTc4NDQiLCJpZCI6Mzk4NDk4LCJpYXQiOjE3NzI3MDAxMzB9.dqusYhifXL6vnbTMlGlOI1nP7ycmZzP4fVEw8Ixa_Dc";


const socket = io({ transports: ["websocket"] });

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
const flightTrails = {};

// ============================
// SATELLITES (Backend)
// ============================
socket.on("satellites", function (sats) {

  Object.values(satEntities).forEach(e =>
    viewer.entities.remove(e)
  );
  Object.keys(satEntities).forEach(k =>
    delete satEntities[k]
  );

  sats.forEach(s => {

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
      name: s.name,
      description: `
        <b>Object:</b> ${s.name}<br/>
        <b>Latitude:</b> ${s.lat.toFixed(2)}°<br/>
        <b>Longitude:</b> ${s.lon.toFixed(2)}°<br/>
        <b>Altitude:</b> ${(s.altitude / 1000).toFixed(2)} km
      `
    });

    satEntities[s.name] = entity;
  });
});

// ============================
// FLIGHTS (Browser - Free Mode)
// ============================
async function fetchFlights() {
  try {

    const res = await fetch("https://opensky-network.org/api/states/all");

    // Handle rate limit
    if (!res.ok) {
      console.log("OpenSky rate limited:", res.status);
      return;
    }

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
    console.log("Flight fetch failed");
  }
}

function updateFlights(flights) {

  flights.forEach(s => {

    const callsign = s[1]?.trim() || "FLIGHT";
    const lat = s[6];
    const lon = s[5];
    const altitude = s[7] || 10000;
    const heading = s[10] || 0;

    const position = Cesium.Cartesian3.fromDegrees(
      lon,
      lat,
      altitude
    );

    if (!flightTrails[callsign]) {
      flightTrails[callsign] = [];
    }

    flightTrails[callsign].push(position);

    // Limit trail length
    if (flightTrails[callsign].length > 15) {
      flightTrails[callsign].shift();
    }

    if (flightEntities[callsign]) {

      flightEntities[callsign].position = position;
      flightEntities[callsign].billboard.rotation =
        Cesium.Math.toRadians(heading);

      flightEntities[callsign].polyline.positions =
        flightTrails[callsign];

    } else {

      const entity = viewer.entities.add({
        position: position,
        billboard: {
          image: "https://cdn-icons-png.flaticon.com/512/34/34627.png",
          width: 18,
          height: 18,
          rotation: Cesium.Math.toRadians(heading),
          alignedAxis: Cesium.Cartesian3.UNIT_Z
        },
        polyline: {
          positions: flightTrails[callsign],
          width: 2,
          material: Cesium.Color.CYAN
        },
        label: {
          text: callsign,
          font: "10px monospace",
          fillColor: Cesium.Color.CYAN,
          pixelOffset: new Cesium.Cartesian2(0, -20)
        },
        name: callsign,
        description: `
          <b>Callsign:</b> ${callsign}<br/>
          <b>Latitude:</b> ${lat.toFixed(2)}°<br/>
          <b>Longitude:</b> ${lon.toFixed(2)}°<br/>
          <b>Altitude:</b> ${(altitude / 1000).toFixed(2)} km<br/>
          <b>Heading:</b> ${heading}°
        `
      });

      flightEntities[callsign] = entity;
    }
  });
}

// Poll every 60 seconds (avoid 429)
setInterval(fetchFlights, 60000);
fetchFlights();
