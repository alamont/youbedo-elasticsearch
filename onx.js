var fs = require('fs');
var parseString = require('xml2js').parseString;
var path = require('path');
Util = require('util');

readOnx = function(onx_file_path, callback){
  fs.readFile(onx_file_path, 'utf8', function(err, data){
    if (err) throw err;
    parseString(data, { explicitArray: false, emptyTag: {} }, function (err, result) {
      if (err) throw err;
      callback(result);
    });
  });
}

parseOnx = function(xml, callback){
  parseString(xml, { explicitArray: false, emptyTag: {} }, function (err, result) {
    if (err) throw err;
    callback(result);
  });
}