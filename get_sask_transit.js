var exec = require('child_process').exec;
var fs = require('fs');
var gdal = require('gdal')

var dir = 'data/';
var outBusStops = 'bus_stops.shp';
var outBusLines = 'bus_lines.shp';

// create data folder if it doesn't exist
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

var outBusStops = dir + outBusStops;
var outBusLines = dir + outBusLines;

// delete previous output
fs.readdirSync(dir).filter(function(f){
  return /^bus/.test(f);
}).map(function(f){
  fs.unlink(dir + f);
})

var wgs84 = gdal.SpatialReference.fromEPSG(4326);
var outDs = gdal.open(outBusStops, 'w', 'ESRI Shapefile');
var outDs2 = gdal.open(outBusLines, 'w', 'ESRI Shapefile');
var outLayer = outDs.layers.create("stops", wgs84, gdal.wkbPoint);
var outLayer2 = outDs2.layers.create("lines", wgs84, gdal.wkbLineString);

//setup fields for the given layer
outLayer.fields.add(new gdal.FieldDefn('stop_id', gdal.OFTInteger));
outLayer.fields.add(new gdal.FieldDefn('abbr', gdal.OFTString));
outLayer.fields.add(new gdal.FieldDefn('ivr_num', gdal.OFTString));
outLayer.fields.add(new gdal.FieldDefn('name', gdal.OFTString));
outLayer.fields.add(new gdal.FieldDefn('dir_id', gdal.OFTString));

outLayer2.fields.add(new gdal.FieldDefn('id', gdal.OFTInteger));
outLayer2.fields.add(new gdal.FieldDefn('abbr', gdal.OFTString));
outLayer2.fields.add(new gdal.FieldDefn('name', gdal.OFTString));
outLayer2.fields.add(new gdal.FieldDefn('dir_id', gdal.OFTInteger));
outLayer2.fields.add(new gdal.FieldDefn('dir_name', gdal.OFTString));
outLayer2.fields.add(new gdal.FieldDefn('color', gdal.OFTString));

// get list of the routes

var nLine, cLine;

var params = {"version":"1.1","method":"GetListOfLines"};
console.log('------');
scrapeData(params, function(data){
  var lines = JSON.parse(data).result.retLineWithDirInfos;
  console.log('Total routes: ' + lines.length);

  // loop thru each line
  nLine = lines.length;
  for (var i = 0; i < nLine; i++) {
    cLine = i;
    var _lineId = parseInt(lines[i].lineId);  // 8699
    var _lineAbbr = lines[i].abbr;      // "01"
    var _lineName = lines[i].name;      // "City Centre / Exhibition"
    var _lineColor = lines[i].color;    // "#a21f6c"

    // loop thru each direction
    var _dirs = lines[i].drInfos;
    for (var j = 0; j < _dirs.length; j++) {
      var _dirId = _dirs[j].lineDirId;  // 86990
      var _dirName = _dirs[j].dirName;  // "City Centre"

      var feature2 = new gdal.Feature(outLayer2);
      feature2.fields.set('id', _lineId);
      feature2.fields.set('abbr', _lineAbbr);
      feature2.fields.set('name', _lineName);
      feature2.fields.set('dir_id', _dirId);
      feature2.fields.set('dir_name', _dirName);
      feature2.fields.set('color', _lineColor);

      (function(feature2, cLine, _dirId, _lineAbbr){

        var nStop, cStop;
        setTimeout(function(){
          console.log('Processing route ' + _lineAbbr + ' (' + (cLine + 1) + '/' + nLine + ')');

          // get routes
          params = {
            "version":"1.1",
            "method":"GetStopsForLine",
            "params":{
              "reqLineDirIds":[{"lineDirId":_dirId}]
            }
          };

          scrapeData(params, function(data){
            var stops = JSON.parse(data).result.stops;

            // loop thru each stop
            nStop = stops.length;
            var coordsLine = [];
            for (var k = 0; k < nStop; k++) {
              cStop = k;
              var _stopId = stops[k].stopId;
              var _stopAbbr = stops[k].abbr;
              var _stopivrNum = stops[k].ivrNum;
              var _stopName = stops[k].name;
              var _latLon = stops[k].point;

              var feature = new gdal.Feature(outLayer);
              feature.fields.set('stop_id', _stopId);
              feature.fields.set('abbr', _stopAbbr);
              feature.fields.set('ivr_num', _stopivrNum);
              feature.fields.set('name', _stopName);
              feature.fields.set('dir_id', _dirId);

              var coordsPoint = [parseFloat(_latLon.lon), parseFloat(_latLon.lat)].join(' ');

              coordsLine.push(coordsPoint);

              feature.setGeometry(gdal.Geometry.fromWKT("POINT (" + coordsPoint + "), 4326"));
              outLayer.features.add(feature);
            } // end loop thru each stop

            // outLayer.flush();

            feature2.setGeometry(gdal.Geometry.fromWKT("LineString (" + coordsLine.join(',') + "), 4326"));
            outLayer2.features.add(feature2);

            // check if it's finished
            console.log('line:' + cLine + '/' + nLine + ', ' + 'points:' + cStop + '/' + nStop);
            if((cLine + 1 === nLine) && (cStop + 1 == nStop)){
              outLayer.flush();
              outLayer2.flush();
              console.log('Job done!');
            }
          });

        }, cLine * 500);

      })(feature2, cLine, _dirId, _lineAbbr);

    } // loop thru each direction
  } // loop thru each line
});

function scrapeData(params, callback){
  var url =  'http://transitego.saskatoon.ca/RealTimeManager';
  var cookie = 'SessionId=2hk55maoeo537; __utma=26372856.684147.1473480117.1473521009.1473523232.3; __utmc=26372856; __utmz=26372856.1473480117.1.1.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided)';

  var data = JSON.stringify(params);

  var cmd = 'curl \'' + url + '\' -H \'Origin: http://transitego.saskatoon.ca\' -H \'Accept-Encoding: gzip, deflate\' -H \'Accept-Language: en-US,en;q=0.8,zh-TW;q=0.6,zh;q=0.4,zh-CN;q=0.2,ja;q=0.2\' -H \'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36\' -H \'Content-Type: application/json\' -H \'Accept: */*\' -H \'Referer: http://transitego.saskatoon.ca/hiwire?.a=iRealTimeDisplay\' -H \'Cookie: ' + cookie + '\' -H \'Connection: keep-alive\' --data-binary  \'' + data + '\'  --compressed';

  exec(cmd, function(error, stdout, stderr) {
    if(error){
      console.log('error:', error);
      return;
    }else{
      return callback(stdout);
    }
  });
}
