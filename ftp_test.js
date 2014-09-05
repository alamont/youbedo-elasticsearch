var fs = require('fs');
var parseString = require('xml2js').parseString;
var path = require('path');
var Util = require('util');
var Q = require('q');
var AdmZip = require('adm-zip');
var FtpClient = require('ftp');
require('./es.js');

var ftp = new FtpClient();
ftp.on('ready', function() {
  ftp.cwd('.hist', function(err, currentDir) {
    if (err) throw err;

    ftp.list("onix30*mut*.zip", function(err, files) {
      if (err) throw err;

      files.forEach(function(file){

        var deferred = Q.defer();

        ftp.get(file.name, function(err, stream){
          if (err) { deferred.reject(new Error(err)); }

          var bufs = [];
          stream.on('data', function(chunk) {
            bufs.push(chunk);
          })

          stream.on('end', function() {
            var buf = Buffer.concat(bufs);
            var zip = new AdmZip(buf);
            var zipEntries = zip.getEntries();
            zipEntries.forEach(function(zipEntry){
              var onx_buffer = zipEntry.getData();
              updateBooks(onx_buffer.toString('utf-8'), function(res) {
                if (res){
                  console.log("Processed " + file.name);
                }else{
                  console.error("FAILED AT " + file.name);
                }
                deferred.resolve();
              });
            });

          });

        });

        return deferred.promise;

      });
    });


  });
});

ftp.connect({host: "ftp1.boekhuis.nl", user: "9198601", password: "kigkbNv3"});