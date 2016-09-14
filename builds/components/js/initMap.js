global.mapboxgl = require('mapbox-gl');

function initMap(){
  global.map = new mapboxgl.Map({
    container: 'map',
    center: DEFAULT.map.center,
    zoom: DEFAULT.map.zoom,
    attributionControl: false,
    infoControl: true,
    style: 'gl-styles/styles/bright-v9.json'
  });

  // gps = new mapboxgl.Geolocate({position: 'top-right'});
  // map.addControl(gps); // position is optional

  map.on('load', function () {

    map.addSource('pokemon',{
      type: 'vector',
      tiles: ['http://gis1test.usask.ca:8889/pokemon/{z}/{x}/{y}']
    });

    map.addLayer({
      id: 'pokemon-stops',
      type: 'symbol',
      source: 'pokemon',
      'source-layer': 'pokemon-stops',
      filter: ["==", "poke_type", 1],
      layout: {
        'icon-image': 'triangle-stroked-15',
        'icon-allow-overlap': true,
        // "text-field": "{poke_title}",
        "text-font": [
          "Open Sans Semibold"
        ],
        // "text-transform": "uppercase",
        "text-letter-spacing": 0.1,
        "text-offset": [0, 1.5],
        "text-size": {
          "base": 1.4,
          "stops": [[10, 8], [20, 14]]
        }
      },
      paint: {
        "text-color": "#060",
        "text-halo-color": "rgba(255,255,255,0.75)",
        "text-halo-width": 2,
        "icon-color" : "red",
        "icon-halo-width": 5,
        "icon-halo-color": "rgba(255,255,255,0.75)"
      }
    }, DEFAULT.map.stackBaseLayer);
    map.setLayoutProperty('pokemon-stops', 'visibility', 'none');

    layer_broker.addLayer('pokemon-stops');

    map.addLayer({
      id: 'pokemon-gyms',
      type: 'symbol',
      source: 'pokemon',
      'source-layer': 'pokemon-stops',
      filter: ["==", "poke_type", 2],
      layout: {
        'icon-image': 'triangle-11',
        'icon-allow-overlap': true,
        // "text-field": "{poke_title}",
        "text-font": [
          "Open Sans Semibold"
        ],
        // "text-transform": "uppercase",
        "text-letter-spacing": 0.1,
        "text-offset": [0, 1.5],
        "text-size": {
          "base": 1.4,
          "stops": [[10, 8], [20, 14]]
        }
      },
      paint: {
        "text-color": "#060",
        "text-halo-color": "rgba(255,255,255,0.75)",
        "text-halo-width": 2,
        "icon-color" : "red",
        "icon-halo-width": 5,
        "icon-halo-color": "rgba(255,255,255,0.75)"
      }
    }, DEFAULT.map.stackBaseLayer);
    map.setLayoutProperty('pokemon-gyms', 'visibility', 'none');

    layer_broker.addLayer('pokemon-gyms');

    map.on('mousemove', function(e){

      var features = map.queryRenderedFeatures(e.point, { layers: layer_broker.getLayerIds() });
      map.getCanvas().style.cursor = features.length ? 'pointer' : '';

    }); // end map.mousemove

    map.on('click', function(e){

      var features = map.queryRenderedFeatures(e.point, {layers: layer_broker.getLayerIds() });
      if(features.length){
        console.log(JSON.stringify(features));
      }
    });

    console.log('Initialized: Map');
  }); // end map.on("load")
} // end function initMap
