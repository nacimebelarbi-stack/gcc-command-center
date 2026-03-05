
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0M2ZlMDNlMS05YmQ3LTQ2MWUtYTA2NC1iZWY5N2IwNTc4NDQiLCJpZCI6Mzk4NDk4LCJpYXQiOjE3NzI3MDAxMzB9.dqusYhifXL6vnbTMlGlOI1nP7ycmZzP4fVEw8Ixa_Dc";

const socket = io({
  transports: ["websocket"]
});

const viewer = new Cesium.Viewer("cesiumContainer", {
  timeline: false,
  animation: false,
  baseLayerPicker: false
});

// Focus on GCC
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(50, 25, 20000000)
});

const satEntities = {};
const flightEntities = {};

// ==============================
// SATELLITES FROM BACKEND
// ==============================
socket.on("satellites", function(sats) {

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
// FLIGHTS DIRECT FROM BROWSER
// ==============================

// ==============================
// FLIGHTS (SMOOTH UPDATE)
// ==============================

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

    flights.forEach(s => {

      const callsign = s[1]?.trim() || "FLIGHT";
      const lat = s[6];
      const lon = s[5];
      const altitude = s[7] || 10000;
      const heading = s[10] || 0;

      if (flightEntities[callsign]) {
        // UPDATE EXISTING
        flightEntities[callsign].position =
          Cesium.Cartesian3.fromDegrees(lon, lat, altitude);

        flightEntities[callsign].billboard.rotation =
          Cesium.Math.toRadians(heading);

      } else {
        // CREATE NEW
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
          }
        });

        flightEntities[callsign] = entity;
      }
    });

  } catch (err) {
    console.log("Flight fetch failed:", err);
  }
}

// Update every 10 seconds
setInterval(fetchFlights, 10000);
fetchFlights();

