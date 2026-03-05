
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

// =============================
// RADAR SWEEP EFFECT
// =============================
const radarCenter = Cesium.Cartesian3.fromDegrees(50, 25);

const radar = viewer.entities.add({
  position: radarCenter,
  ellipse: {
    semiMinorAxis: 1500000.0,
    semiMajorAxis: 1500000.0,
    material: new Cesium.ImageMaterialProperty({
      image: "https://i.imgur.com/3ZQ3ZQk.png", // simple radar ring image
      transparent: true
    })
  }
});

// =============================
// ALTITUDE COLOR FUNCTION
// =============================
function getAltitudeColor(alt) {
  if (alt < 3000) return Cesium.Color.YELLOW;
  if (alt < 8000) return Cesium.Color.CYAN;
  if (alt < 12000) return Cesium.Color.WHITE;
  return Cesium.Color.LIME;
}

// =============================
// SATELLITES
// =============================
socket.on("satellites", function(sats) {

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
        <div style="font-family: monospace">
          <b>Object:</b> ${s.name}<br/>
          <b>Altitude:</b> ${(s.altitude/1000).toFixed(2)} km
        </div>
      `
    });

    satEntities[s.name] = entity;
  });
});

// =============================
// FLIGHT FETCH (Browser)
// =============================
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

// =============================
// UPDATE FLIGHTS WITH TRAILS
// =============================
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
    if (flightTrails[callsign].length > 30) {
      flightTrails[callsign].shift();
    }

    const color = getAltitudeColor(altitude);

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
          material: color
        },
        label: {
          text: callsign,
          font: "10px monospace",
          fillColor: color,
          pixelOffset: new Cesium.Cartesian2(0, -20)
        },
        name: callsign,
        description: `
          <div style="font-family: monospace">
            <b>Callsign:</b> ${callsign}<br/>
            <b>Altitude:</b> ${(altitude/1000).toFixed(2)} km<br/>
            <b>Heading:</b> ${heading}°
          </div>
        `
      });

      flightEntities[callsign] = entity;
    }
  });
}

// Refresh flights
setInterval(fetchFlights, 8000);
fetchFlights();
