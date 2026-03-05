// ==============================
// CESIUM TOKEN
// ==============================
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0M2ZlMDNlMS05YmQ3LTQ2MWUtYTA2NC1iZWY5N2IwNTc4NDQiLCJpZCI6Mzk4NDk4LCJpYXQiOjE3NzI3MDAxMzB9.dqusYhifXL6vnbTMlGlOI1nP7ycmZzP4fVEw8Ixa_Dc";

// ==============================
// SOCKET CONNECTION
// ==============================
const socket = io({
  transports: ["websocket"]
});

// ==============================
// CREATE CESIUM VIEWER (DEFAULT SAFE MODE)
// ==============================
const viewer = new Cesium.Viewer("cesiumContainer", {
  timeline: false,
  animation: false,
  baseLayerPicker: false
});

// ==============================
// FORCE CAMERA TO GCC REGION
// ==============================
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(
    50,   // Longitude
    25,   // Latitude
    20000000 // Height
  )
});

// ==============================
// ENTITY STORAGE
// ==============================
const satEntities = {};
const flightEntities = {};

// ==============================
// SATELLITES
// ==============================
socket.on("satellites", sats => {

  // Remove old satellites
  Object.values(satEntities).forEach(entity =>
    viewer.entities.remove(entity)
  );
  Object.keys(satEntities).forEach(key =>
    delete satEntities[key]
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
      }
    });

    satEntities[s.name] = entity;
  });
});

// ==============================
// FLIGHTS
// ==============================
socket.on("flights", flights => {

  // Remove old flights
  Object.values(flightEntities).forEach(entity =>
    viewer.entities.remove(entity)
  );
  Object.keys(flightEntities).forEach(key =>
    delete flightEntities[key]
  );

  flights.forEach(f => {

    const entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(
        f.lon,
        f.lat,
        f.altitude || 10000
      ),
      point: {
        pixelSize: 5,
        color: Cesium.Color.CYAN
      },
      label: {
        text: f.callsign || "FLIGHT",
        font: "10px monospace",
        fillColor: Cesium.Color.CYAN
      }
    });

    flightEntities[f.callsign || Math.random()] = entity;
  });
});
});


