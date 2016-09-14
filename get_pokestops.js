var exec    = require('child_process').exec;
var request = require('request');
var fs      = require('fs');
var gdal    = require('gdal')

// var cookieJar = request.jar();

var dir = 'data/';
var outPoint = 'poke_stops.shp';
var interval_prevent_spam = 10000;

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

var delta = 0.03;
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
        scrapeData({
          fromlat: curLat,
          tolat: curLat + delta + 0.2 * delta,
          fromlng: curLng,
          tolng: curLng + delta + 0.2 * delta
          }, function(json){
          cGrid ++;
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          console.log('Progress: ' + (cGrid * 100 / nGrid).toFixed(1) + '%');

          if(json){
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
          // console.log('cGrid / nGrid: ' + cGrid + '/' + nGrid);

          var tmr_cnt = 1;
          var tmr = setInterval(function(){
            var remaining_sec = interval_prevent_spam / 1000 - tmr_cnt;
            if(remaining_sec <= 0){
              clearInterval(tmr);
            }else{
              process.stdout.clearLine();
              process.stdout.cursorTo(0);
              process.stdout.write('Time till next call: ' + remaining_sec + 's...');
            }
            tmr_cnt ++;
          }, 1000);

        }); // end scrapeData
      }, cTimer * interval_prevent_spam);
      cTimer ++;
    })(curLat, curLng, delta); // end closure
  } // end for j
} // end for i


function scrapeData(params, callback){
  var url =  'http://www.pokemongomap.info/includes/mapdata.php';
  var cookie = 'Cookie: PHPSESSID=5dnanefib6niqqs1ggqoijeop7; _gat=1; __atuvc=2%7C37; __atuvs=57d8f20ee091a608001; _ga=GA1.2.538335004.1473835535; latlngzoom=10[##split##]52.08513109933017[##split##]-106.7489345291504';

  var data = JSON.stringify(params);

  var cmd = 'curl \'http://www.pokemongomap.info/includes/mapdata.php\' -H \'Cookie: PHPSESSID=5dnanefib6niqqs1ggqoijeop7; _gat=1; __atuvc=2%7C37; __atuvs=57d8f20ee091a608001; _ga=GA1.2.538335004.1473835535; latlngzoom=10[##split##]52.08513109933017[##split##]-106.7489345291504\' -H \'Origin: http://www.pokemongomap.info\' -H \'Accept-Encoding: gzip, deflate\' -H \'Accept-Language: en-US,en;q=0.8,zh-TW;q=0.6,zh;q=0.4,zh-CN;q=0.2,ja;q=0.2\' -H \'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36\' -H \'Content-Type: application/x-www-form-urlencoded; charset=UTF-8\' -H \'Accept: application/json, text/javascript, */*; q=0.01\' -H \'Cache-Control: max-age=0\' -H \'X-Requested-With: XMLHttpRequest\' -H \'Connection: keep-alive\' -H \'Referer: http://www.pokemongomap.info/\' --data \'fromlat=' + params.fromlat + '&tolat=' + params.tolat + '&fromlng=' + params.fromlng + '&tolng=' + params.tolng + '&fpoke=1&fgym=1\' --compressed';

  exec(cmd, function(error, stdout, stderr) {
    if(error){
      console.log('error:', error);
      return callback(null);
    }else{
      data = JSON.parse(stdout);
      if(data.spam){
        throw 'Spam detected! Spamtime:' + data.spamtime + 's';
      }else{
        if(data.length >= 350){
          throw 'Warning: Max # of Pokemon stops returned.';
        }else{
          return callback(data);
        }
      }
    }
  });
}
