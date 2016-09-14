global.layer_broker = (function(){
  var _lyrBus = {};
  var _lyrs = [];

  return{
    showBusLine: function(dirId){

      // hide other lines
      for(var i in _lyrBus){
        if(i !== dirId){
          console.log('hiding ' + _lyrBus[i]);
          map.setLayoutProperty(_lyrBus[i], 'visibility', 'none');
          // console.log('hiding ' + _lyrBus[i].replace('line', 'stop'));
          map.setLayoutProperty(_lyrBus[i].replace('line', 'stop'), 'visibility', 'none');
        }
      }
      _lyrBus = {};
      _lyrs = [];

      if(parseInt(dirId) == -1) return;

      // show current line
      if(!_lyrBus[dirId]){
        var id = 'bus_line' + dirId;
        _lyrBus[dirId] = id;
        if(parseInt(dirId) !== -2){
          map.addLayer({
            id: id,
            type: 'line',
            source: 'pokemon',
            'source-layer': 'bus-lines',
            filter: ['==', 'dir_id', parseInt(dirId)],
            paint: {
              'line-color': 'rgb(255, 0, 0)',
              'line-width': 4,
              'line-opacity': 0.6
            }
          }, DEFAULT.map.stackBaseLayer);
        }else{
          map.addLayer({
            id: id,
            type: 'line',
            source: 'pokemon',
            'source-layer': 'bus-lines',
            paint: {
              'line-color': 'rgb(255, 0, 0)',
              'line-width': 2,
              'line-opacity': 0.6
            }
          }, DEFAULT.map.stackBaseLayer);
        }

        _lyrs.push(id);

        id = 'bus_stop' + dirId;
        map.addLayer({
          id: id,
          type: 'symbol',
          source: 'pokemon',
          'source-layer': 'bus-stops',
          filter: ['==', 'dir_id', dirId],
          layout: {
            'icon-image': 'circle-11',
            'icon-allow-overlap': true,
            'text-font': [
              'Open Sans Semibold'
            ],
            'text-field': $('#toggle_bus_stop_title').prop('checked') ? '{name}' : '',
            // 'text-transform': 'uppercase',
            'text-letter-spacing': 0.1,
            'text-offset': [0, 1.5],
            'text-size': {
              'base': 1.4,
              'stops': [[10, 8], [20, 14]]
            }
          },
          paint: {
            'text-color': '#000',
            'text-halo-color': 'rgba(255,255,255,0.75)',
            'text-halo-width': 2,
            'icon-color' : 'red',
            'icon-halo-width': 5,
            'icon-halo-color': 'rgba(255,255,255,0.75)'
          }
        }, DEFAULT.map.stackBaseLayer);
        _lyrs.push(id);
      }else{
        map.setLayoutProperty(_lyrBus[dirId], 'visibility', 'visible');
        map.setLayoutProperty(_lyrBus[dirId].replace('line', 'stop'), 'visibility', 'visible');
      }
    },
    hideBusLine: function(dirId){
      map.setLayoutProperty(_lyrBus[dirId], 'visibility', 'none');
      map.setLayoutProperty(_lyrBus[dirId].replace('line', 'stop'), 'visibility', 'visible');
    },
    showBusStop: function(flag){
      for(var i in _lyrBus){
        var _id = _lyrBus[i].replace('line', 'stop');
        map.setLayoutProperty(_id, 'visibility', flag ? 'visible' : 'none');
      }
    },
    showBusStopTitles: function(flag){
      for(var i in _lyrBus){
        var _id = _lyrBus[i].replace('line', 'stop');
        console.log('turning off title: ' + _id);
        map.setLayoutProperty(_id, 'text-field', flag ? '{name}' : '');
      }
    },
    addLayer: function(layer_id){
      _lyrs.push(layer_id);
    },
    getLayerIds: function(){
      return _lyrs;
    }
  };

})();
