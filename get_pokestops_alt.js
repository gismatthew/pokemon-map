var request = require('request');
var fs = require('fs');
var gdal = require('gdal')

// var cookieJar = request.jar();

var dir = 'data/';
var outPoint = 'poke_stops_integrated2.shp';

// create data folder if it doesn't exist
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

// delete previous output
fs.readdirSync(dir).filter(function(f){
  return /^output/.test(f);
}).map(function(f){
  fs.unlink(dir + f);
})

var saskatoon = {
  lower_left: {lat: 52.069560, lng: -106.780631},
  upper_right: {lat: 52.212838, lng: -106.518333}
};

var delta = 0.02;
var curLng = saskatoon.lower_left.lng - delta;
var curLat = saskatoon.lower_left.lat - delta;
var inx = 0;

var outfile = dir + outPoint;
var outDs = gdal.open(outfile, 'w', 'ESRI Shapefile');
var dict = {};
var wgs84 = gdal.SpatialReference.fromEPSG(4326);
var outLayer = outDs.layers.create("poke_stops", wgs84, gdal.wkbPoint);

//setup fields
outLayer.fields.add(new gdal.FieldDefn('poke_id', gdal.OFTInteger));
outLayer.fields.add(new gdal.FieldDefn('poke_title', gdal.OFTString));
outLayer.fields.add(new gdal.FieldDefn('poke_type', gdal.OFTInteger));
outLayer.fields.add(new gdal.FieldDefn('realrand', gdal.OFTInteger));
outLayer.fields.add(new gdal.FieldDefn('enabled', gdal.OFTInteger));
outLayer.fields.add(new gdal.FieldDefn('confirm', gdal.OFTInteger));
outLayer.fields.add(new gdal.FieldDefn('cleantitle', gdal.OFTString));

var nGridCol = (saskatoon.upper_right.lng - saskatoon.lower_left.lng) / delta;
var nGridRow = (saskatoon.upper_right.lat - saskatoon.lower_left.lat) / delta;
nGridCol = nGridCol.toFixed(0);
nGridRow = nGridRow.toFixed(0);
var nGrid = (nGridCol * nGridRow).toFixed(0);
var cGrid = 0;
var cTimer = 0;

for (var i = 0; i < nGridCol; i++) {
  for (var j = 0; j < nGridRow; j++) {
    var curLng = saskatoon.lower_left.lng + i * delta - 0.25 * delta;
    var curLat = saskatoon.lower_left.lat + j * delta - 0.25 * delta;

    (function(curLat, curLng, delta){
      setTimeout(function(){
        scrapeData(curLat, curLat + delta + 0.25 * delta, curLng, curLng + delta + 0.25 * delta, function(data){

          cGrid ++;
          console.log('Processing ' + (cGrid * 100 / nGrid).toFixed(2) + '%');

          if(data){
            var json = JSON.parse(data);
            for (var k = 0; k < json.length; k++) {
              // console.log('adding ' + json[k].poke_id);
              var id = [json[k].poke_lng, json[k].poke_lat].join('');
              if(dict[id]) continue; // if we have this point already, then we skip it
              dict[id] = 1;
              var feature = new gdal.Feature(outLayer);
              feature.fields.set('poke_id', parseInt(json[k].poke_id));
              feature.fields.set('poke_title', json[k].poke_title);
              feature.fields.set('poke_type', parseInt(json[k].poke_type));
              feature.fields.set('realrand', parseInt(json[k].realrand));
              feature.fields.set('enabled', parseInt(json[k].poke_enabled));
              feature.fields.set('confirm', parseInt(json[k].confirm));
              feature.fields.set('cleantitle', json[k].cleantitle);
              feature.setGeometry(gdal.Geometry.fromWKT(" POINT (" + parseInt(json[k].poke_lng)/1e6 + " " + parseInt(json[k].poke_lat)/1e6 + ") "));
              outLayer.features.add(feature);
            } // end for k
          } // end if(data)
          if(cGrid >= nGrid){

          }
          outLayer.flush();
          console.log('cGrid / nGrid: ' + cGrid + '/' + nGrid);
        });
      }, cTimer * 10000);
      cTimer ++;
    })(curLat, curLng, delta); // end closure
  } // end for j
} // end for i

function scrapeData(lat1, lat2, lng1, lng2, callback){
  request.post({
    url: 'http://www.pokemongomap.info/includes/mapdata.php',
    headers: {
      "Cookie": "Cookie: PHPSESSID=81nai2pqn68kr5qt93opp748g5; _gat=1; __atuvc=2%7C37; __atuvs=57d8f0f7be34f384001; _ga=GA1.2.1576464343.1473835255; latlngzoom=12[##split##]37.8682573[##split##]-122.28137090000001",
      "Origin": "http'://www.pokemongomap.info",
      // "Accept-Encoding": "gzip, deflate",
      "Accept-Language": "en-US,en;q=0.8,zh-TW;q=0.6,zh;q=0.4,zh-CN;q=0.2,ja;q=0.2",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "Accept": "application/json, text/javascript, */*; q=0.01",
      "Referer": "http'://www.pokemongomap.info/",
      "X-Requested-With": "XMLHttpRequest",
      "Connection": "keep-alive'"
    },
    form:{
      fromlat: lat1,
      tolat: lat2,
      fromlng: lng1,
      tolng: lng2,
      fpoke: 1,
      fgym: 1
    }}, function(err, httpResponse, body) {
      // console.log(httpResponse);
      if(err){
        if(err.spam){
          throw 'Spam detected! Spamtime:' + err.spamtime + 's';
        }else{
          return console.log(err);
        }
      }

      data = JSON.parse(body);
      console.log('length: ' + data.length);
      if(data instanceof Array){
        // console.log('-- Length: ' + data.length);
        if(data.length >= 350){
          throw 'Warning: Max # of Pokemon stops returned.';
        }else{
          return callback(body);
        }
      }else{
        console.log('-- No array returned.');
      }
    }
  );
}
