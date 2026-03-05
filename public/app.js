// === CESIUM TOKEN ===
Cesium.Ion.defaultAccessToken = "YOUR_TOKEN_HERE";

// === SOCKET CONNECTION ===
const socket = io({
  transports: ["websocket"]
});

// === CREATE VIEWER (FORCE TERRAIN + IMAGERY) ===
const viewer = new Cesium.Viewer("cesiumContainer", {
  terrainProvider: Cesium.createWorldTerrain(),
  imageryProvider: new Cesium.IonImageryProvider({ assetId: 2 }),
  timeline: false,
  animation: false,
  baseLayerPicker: false
});

// === FORCE CAMERA TO GCC ===
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(
    50,   // Longitude (GCC center)
    25,   // Latitude
    20000000 // Height
  )
});

// === ENTITY STORAGE ===
const satEntities = {};
const flightEntities = {};

// =============================
// SATELLITES
// =============================
socket.on("satellites", sats => {

  // Clear previous satellites
  Object.values(satEntities).forEach(e => viewer.entities.remove(e));
  Object.keys(satEntities).forEach(k => delete satEntities[k]);

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

// =============================
// FLIGHTS
// =============================
socket.on("flights", flights => {

  // Clear previous flights
  Object.values(flightEntities).forEach(e => viewer.entities.remove(e));
  Object.keys(flightEntities).forEach(k => delete flightEntities[k]);

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

    flightEntities[f.callsign] = entity;
  });
});
