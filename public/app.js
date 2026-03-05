
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

// Focus camera on GCC
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(50, 25, 20000000)
});

const satEntities = {};
const flightEntities = {};


// ============================
// SATELLITES (from backend)
// ============================
socket.on("satellites", function(sats) {

  // Clear old satellites
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
// FLIGHTS (from backend)
// ============================
socket.on("flights", function(flights) {

  // Clear old flights
  Object.values(flightEntities).forEach(e =>
    viewer.entities.remove(e)
  );
  Object.keys(flightEntities).forEach(k =>
    delete flightEntities[k]
  );

  flights.forEach(f => {

    const entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(
        f.lon,
        f.lat,
        f.altitude
      ),
      billboard: {
        image: "https://cdn-icons-png.flaticon.com/512/34/34627.png",
        width: 18,
        height: 18,
        rotation: Cesium.Math.toRadians(f.heading),
        alignedAxis: Cesium.Cartesian3.UNIT_Z
      },
      label: {
        text: f.callsign,
        font: "10px monospace",
        fillColor: Cesium.Color.CYAN,
        pixelOffset: new Cesium.Cartesian2(0, -20)
      },
      name: f.callsign,
      description: `
        <div style="font-family: monospace">
          <b>Callsign:</b> ${f.callsign}<br/>
          <b>ICAO:</b> ${f.icao}<br/>
          <b>Latitude:</b> ${f.lat.toFixed(2)}°<br/>
          <b>Longitude:</b> ${f.lon.toFixed(2)}°<br/>
          <b>Altitude:</b> ${(f.altitude/1000).toFixed(2)} km<br/>
          <b>Heading:</b> ${f.heading}°
        </div>
      `
    });

    flightEntities[f.callsign] = entity;
  });
});
