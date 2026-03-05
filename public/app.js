
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0M2ZlMDNlMS05YmQ3LTQ2MWUtYTA2NC1iZWY5N2IwNTc4NDQiLCJpZCI6Mzk4NDk4LCJpYXQiOjE3NzI3MDAxMzB9.dqusYhifXL6vnbTMlGlOI1nP7ycmZzP4fVEw8Ixa_Dc";
const socket = io({
  transports: ["websocket"]
});
const viewer = new Cesium.Viewer("cesiumContainer", {
  timeline:false,
  animation:false,
  baseLayerPicker:false
});

socket.on("satellites", sats=>{
  viewer.entities.removeAll();
  sats.forEach(s=>{
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(s.lon,s.lat,s.altitude),
      point:{pixelSize:5,color:Cesium.Color.YELLOW},
      label:{text:s.name,font:"8px monospace"}
    });
  });

});

