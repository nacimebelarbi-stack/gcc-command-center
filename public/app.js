
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0M2ZlMDNlMS05YmQ3LTQ2MWUtYTA2NC1iZWY5N2IwNTc4NDQiLCJpZCI6Mzk4NDk4LCJpYXQiOjE3NzI3MDAxMzB9.dqusYhifXL6vnbTMlGlOI1nP7ycmZzP4fVEw8Ixa_Dc";

const socket = io({
  transports: ["websocket"]
});

const viewer = new Cesium.Viewer("cesiumContainer", {
  timeline: false,
  animation: false,
  baseLayerPicker: false
});

// Center camera on GCC
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(50, 25, 20000000)
});

const satEntities = {};
const flightEntities = {};

// Satellites
socket.on("satellites", function(sats) {

  Object.values(satEntities).forEach(function(entity) {
    viewer.entities.remove(entity);
  });

  Object.keys(satEntities).forEach(function(key) {
    delete satEntities[key];
  });

  sats.forEach(function(s) {

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

// Flights
socket.on("flights", function(flights) {

  Object.values(flightEntities).forEach(function(entity) {
    viewer.entities.remove(entity);
  });

  Object.keys(flightEntities).forEach(function(key) {
    delete flightEntities[key];
  });

  flights.forEach(function(f) {

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

