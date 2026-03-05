Cesium.Ion.defaultAccessToken = "YOUR_TOKEN_HERE";

const socket = io({ transports: ["websocket"] });

const viewer = new Cesium.Viewer("cesiumContainer", {
  timeline:false,
  animation:false,
  baseLayerPicker:false
});

viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(50, 25, 20000000)
});

const satEntities = {};
const flightEntities = {};

socket.on("satellites", sats => {

  Object.values(satEntities).forEach(e => viewer.entities.remove(e));
  Object.keys(satEntities).forEach(k => delete satEntities[k]);

  sats.forEach(s => {

    const entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(
        s.lon, s.lat, s.altitude
      ),
      point: { pixelSize:6, color:Cesium.Color.RED },
      label: {
        text: s.name,
        font: "10px monospace",
        fillColor: Cesium.Color.YELLOW
      },
      polyline: {
        positions: s.orbit.map(p =>
          Cesium.Cartesian3.fromDegrees(p[0], p[1], p[2])
        ),
        width:1,
        material: Cesium.Color.ORANGE
      }
    });

    satEntities[s.name] = entity;
  });
});

socket.on("flights", flights => {

  Object.values(flightEntities).forEach(e => viewer.entities.remove(e));
  Object.keys(flightEntities).forEach(k => delete flightEntities[k]);

  flights.forEach(f => {

    const entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(
        f.lon, f.lat, f.altitude
      ),
      point: { pixelSize:5, color:Cesium.Color.CYAN },
      label: {
        text: f.callsign || "FLIGHT",
        font: "10px monospace",
        fillColor: Cesium.Color.CYAN
      }
    });

    flightEntities[f.callsign] = entity;
  });
});
