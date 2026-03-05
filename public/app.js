const socket = io();
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