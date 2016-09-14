if(!global.$) {
  global.$ = global.jQuery = require('jquery');
}
require('bootstrap');
require('bootstrap-toggle');
require('bootstrap-select');

function init_ui(){

  $('nav li.dropdown').click(function(e){
    // e.stopPropagation();
    // $(this).toggleClass('open');
  });

  $('#menu_toggle_toc').bootstrapToggle({
    size: 'mini',
    on: '<span class="icon icon-sitemap"></span> Show Panel',
    off: '<span class="icon icon-sitemap"></span> Hide Panel',
    width: '160px'
  }).change(function(){
    $('#toc').toggleClass('collapsed');
  });

  $('#menu_toggle_gps').bootstrapToggle({
    size: 'mini',
    on: '<span class="icon icon-sitemap"></span> GPS',
    off: '<span class="icon icon-sitemap"></span> GPS',
    width: '160px'
  }).change(function(){
    if($(this).prop('checked')){
      var options = {enableHighAccuracy: true, timeout: 5000, maximumAge: 100, desiredAccuracy: 0, frequency: 100 };
      global.watchGPS = navigator.geolocation.watchPosition(function(data){
        if(!global.gps_marker){
          global.gps_marker = new mapboxgl.Marker(
            $('<div class="marker"></div>')[0],
            { offset: [-32, -32] }
          );
        }
        var loc = [data.coords.longitude, data.coords.latitude];
        global.gps_marker.setLngLat(loc).addTo(map);
        map.panTo(loc);
      }, function(err){
        console.log('GPS err', err);
      }, options);
    }else{
      if (global.watchGPS !== null) {
        navigator.geolocation.clearWatch(global.watchGPS);
        global.watchGPS = null;
        global.gps_marker.remove();
      }
    }
  });

  $('#toggle_poke_title').bootstrapToggle({
    size: 'mini',
    width: '60px'
  })
    .change(function(){
    if($(this).prop('checked')){
      map.setLayoutProperty('pokemon-stops', 'text-field', '{poke_title}');
      map.setLayoutProperty('pokemon-gyms', 'text-field', '{poke_title}');
    }else{
      map.setLayoutProperty('pokemon-stops', 'text-field', '');
      map.setLayoutProperty('pokemon-gyms', 'text-field', '');
    }
  });

  $('#toggle_poke_stop').bootstrapToggle({
    size: 'mini',
    on: '<span class="icon icon-sitemap"></span> Show Poke Stop',
    off: '<span class="icon icon-sitemap"></span> Hide Poke Stop',
    width: '160px'
  }).change(function(){
    if($(this).prop('checked')){
      map.setLayoutProperty('pokemon-stops', 'visibility', 'visible');
    }else{
      map.setLayoutProperty('pokemon-stops', 'visibility', 'none');
    }
  });

  $('#toggle_poke_gym').bootstrapToggle({
    size: 'mini',
    on: '<span class="icon icon-sitemap"></span> Show Poke Gym',
    off: '<span class="icon icon-sitemap"></span> Hide Poke Gym',
    width: '160px'
  }).change(function(){
    if($(this).prop('checked')){
      map.setLayoutProperty('pokemon-gyms', 'visibility', 'visible');
    }else{
      map.setLayoutProperty('pokemon-gyms', 'visibility', 'none');
    }
  });

  var routes = data_broker.getRoutes();
  var routeDiv = $('#bus-route');
  routeDiv.append('<option value="-1">No route</option>');
  routeDiv.append('<option value="-2">All routes</option>');
  for (var i = 0; i < routes.length; i++) {

    // skip 3xx routes
    if(/3\d{2}/.test(routes[i].abbr)) continue;

    var options = '<optgroup label="Route ' + routes[i].abbr + '">';
    var dirs = routes[i].drInfos;
    for (var j = 0; j < dirs.length; j++) {
      options += '<option value="' + dirs[j].lineDirId + '">' + dirs[j].dirName + '</option>';
    }
    options += '</optgroup>';
    routeDiv.append(options);
  }

  routeDiv.selectpicker()
    .on('changed.bs.select', function(){
      var dirId = $('#bus-route').selectpicker('val');
      layer_broker.showBusLine(dirId);
  });

  // $('#toggle_bus_stop').prop('checked', true);
  // $('#toggle_bus_stop').bootstrapToggle({
  //   on: '<span class="icon icon-sitemap"></span> Show Bus Stop',
  //   off: '<span class="icon icon-sitemap"></span> Hide Bus Stop',
  //   width: '160px'
  // }).change(function(){
  //   if($(this).prop('checked')){
  //     layer_broker.showBusStop(1);
  //   }else{
  //     layer_broker.showBusStop(0);
  //   }
  // });

  $('#toggle_bus_stop_title').prop('checked', true);
  $('#toggle_bus_stop_title').bootstrapToggle({
    size: 'mini',
    width: '60px'
  })
    .change(function(){
      if($(this).prop('checked')){
        layer_broker.showBusStopTitles(1);
      }else{
        layer_broker.showBusStopTitles(0);
      }
  });

  console.log('Initialized: UI');
  initMap();

}
