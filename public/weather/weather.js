//create map and tiles
//use tiles from openstreetmap
const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const geoMap = L.map('geoMap', {minZoom: 2}).setView([0, 0], 2);
const tileOptions = {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}
const tiles = L.tileLayer(tileUrl, tileOptions)
tiles.addTo(geoMap)
//create marker
let geoMarker = L.marker([0, 0]).addTo(geoMap);

function geolocate(){
  if('geolocation' in navigator) {
    console.log('Geolocation is available')
    navigator.geolocation.getCurrentPosition( async (position) => {
      const {latitude, longitude} = position.coords
      //console.log(position.coords.latitude, position.coords.longitude);
      document.getElementById('lat').textContent = latitude;
      document.getElementById('lon').textContent = longitude;
      //update marker
      geoMarker.setLatLng([latitude, longitude]);
      //update view
      geoMap.setView([latitude, longitude], 10);
      //send data to server
      const data = {latitude, longitude};
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      };
      const response = await fetch('/weather', options);
      const response_data = await response.json();
  });
  } else {
    console.log('Geolocation is not available')
  }
}


//use openweather API
const APIkey = "4e387a3ca06bb4b8b6a8a67a7dd346c6"
const lat = 55
const lon = 12


async function getWeather(){
    const response = await fetch(`/weather/${lat}/${lon}`);
    const json = await response.json();
    console.log(json)
}