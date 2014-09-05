var fs = require('fs');
var parseString = require('xml2js').parseString;
var path = require('path');
Util = require('util');

onx2json = function(onx_file_path){
  xml = fs.readFileSync(onx_file_path, 'utf8');
  parseString(xml, { explicitArray: false, emptyTag: {} }, function (err, result) {
    json = JSON.stringify(result);
    json_filename = "json/" + path.basename(onx_file_path).slice(0,-3) + "onx.json"
    fs.writeFileSync(json_filename, json);
    console.log("Writing " + json_filename);
  });
}

readOnx = function(onx_file_path, callback){
  fs.readFile(onx_file_path, 'utf8', function(err, data){
    if (err) throw err;
    parseString(data, { explicitArray: false, emptyTag: {} }, function (err, result) {
      if (err) throw err;
      callback(result);
    });
  });
}