var fs = require('fs');
var parseString = require('xml2js').parseString;
var path = require('path');
var Util = require('util');
var Q = require('q');
var AdmZip = require('adm-zip');
var FtpClient = require('ftp');
require('./es.js');
var sync = require('synchronize');
require('./csv2json.js');


sync.fiber(function(){

  var ftp = new FtpClient();
  ftp.on('ready', function() {
    ftp.cwd('.hist', function(err, currentDir) {
      if (err) throw err;

      // ONX
      ftp.list("onix30*mut*.zip", function(err, files) {
        if (err) throw err;

        sorted_files = files.sort()
        files_names = files.map(function(file){return file.name});
        sorted_file_names = files_names.sort()

        sorted_file_names.forEach(function(file_name){

          var deferred = Q.defer();

          ftp.get(file_name, function(err, stream){
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
                parseOnx(onx_buffer.toString('utf-8'), function(data) {
                  books = data.ONIXMessage.Product;
                  updateBooks(books, function(res) {
                    if (res){
                      // ftp.rename(file_name, file_name + ".done", function(err){
                      //   if (err) throw err;
                      // })
                      console.log("Processed " + file_name);
                    }else{
                      console.error("FAILED AT " + file_name);
                    }
                    deferred.resolve();
                  });
                });
              });

            });

          });

          return deferred.promise;

        });
      });

      //CSV
      ftp.list("*eboeken*.csv", function(err, files) {
        if (err) throw err;

        sorted_files = files.sort()
        files_names = files.map(function(file){return file.name});
        sorted_file_names = files_names.sort()

        sorted_file_names.forEach(function(file_name){

          var deferred = Q.defer();

          ftp.get(file_name, function(err, stream){
            if (err) { deferred.reject(new Error(err)); }

            var bufs = [];
            stream.on('data', function(chunk) {
              bufs.push(chunk);
            })

            stream.on('end', function() {
              var buf = Buffer.concat(bufs);
              parseCSV(bufs, function(err, books){
                updateBooks(books, function(res) {
                  if (res){
                    // ftp.rename(file_name, file_name + ".done", function(err){
                      // if (err) throw err;
                    // })
                    console.log("Processed " + file_name);
                  }else{
                    console.error("FAILED AT " + file_name);
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
});