var fs = require('fs');
elasticsearch = require('elasticsearch');
var log4js = require('log4js');
Util = require('util');
require('./onx.js');
var AdmZip = require('adm-zip');

var serverOptions = {
    host: 'youbedo:foldyourbooks@09cef314ab007c8a000.qbox.io:80',
    log: 'warning'
};

// var serverOptions = {
//     host: 'localhost:9200',
//     log: 'warning'
// };

log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('import.log'), 'log');
var logger = log4js.getLogger('log');

var client = new elasticsearch.Client(serverOptions);

mapping = {
  print_book: {
    properties : {
      ProductSupply: {
        properties: {
          SupplyDetail: {
            properties: {
              Price: {
                type: "nested",
                properties: {
                  PriceDate: {
                    properties: {
                      Date: {
                        properties: {
                          _: {
                            type: "date",
                            format: "basic_date"
                          }
                        }
                      }
                    }
                  }
                }
              },
              SupplyDate: {
                properties: {
                  Date: {
                    properties:{
                      _: {
                        type: "date",
                        format: "basic_date"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      CollateralDetail: {
        properties: {
          TextContent: {
            properties: {
              Text: {
                type: "string",
                analyzer: "dutch"
              }
            }
          }
        }
      },
      PublishingDetail: {
        properties: {
          PublishingDate: {
            properties: {
              Date: {
                properties: {
                  _: {
                    type: "date",
                    format: "basic_date"
                  }
                }
              }
            }
          }
        }
      },
      RelatedMaterial: {
        type: "array"
      }
    }
  }
}

client.indices.create({index: "books"})
  .then(function (body) { client.indices.putMapping({index: "books", type: "print_book", body: mapping}) });

files = fs.readdirSync('/Users/Andres/SkyDrive/Orikami/Youbedo/Dump');
files = files.filter(function(f){return f.search(/.zip$/i) >= 0});
console.log(files)
i = 0;

bulk = function(files,i, callback){

  onx_zip = new AdmZip("/Users/Andres/SkyDrive/Orikami/Youbedo/Dump/" + files[i]);

  onx_zip.getEntries().forEach(function(onx_xml_file) {

    onx_xml = onx_xml_file.getData().toString('utf8');

    parseOnx(onx_xml, function(data){

      books = data.ONIXMessage.Product;
      commands = [];
      books.forEach(function (item) {
        recordReference = item.RecordReference;
        commands.push({ index : { _index :"books", _type : "print_book", _id: recordReference } });
        commands.push(item);
      })

      client.bulk({body: commands}, function(err,resp){
        if (err) {
          throw err;
        } else {
          callback(files[i] + " " + (i + 1) + "/" + files.length);
          if ((i+1) < files.length){
            bulk(files,i+1, function(res){
              console.info(res);
            });
          }else{
            console.info("Done!");
            // process.exit();
          }
        }
      });
    });
  });

}

bulk(files,0, function(res){
  console.info(res);
});