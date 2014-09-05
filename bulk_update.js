var fs = require('fs');
elasticsearch = require('elasticsearch');
var log4js = require('log4js');
Util = require('util');
require('./onx.js');
_ = require('underscore');

// var serverOptions = {
//     host: 'youbedo:foldyourbooks@09cef314ab007c8a000.qbox.io:80',
//     log: 'warning'
// };

const BLOCKS = ["DescriptiveDetail", "CollateralDetail", "ContentDetail", "PublishingDetail", "RelatedMaterial", "ProductSupply"];

var serverOptions = {
    host: 'localhost:9200',
    log: 'warning'
};

log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('import.log'), 'log');
var logger = log4js.getLogger('log');

var client = new elasticsearch.Client(serverOptions);

files = fs.readdirSync('mut');
i = 0;

bulk = function(files,i, callback){

  readOnx("mut/" + files[i], function(data){

    books = data.ONIXMessage.Product;
    commands = [];
    books.forEach(function (book) {

      recordReference = book.RecordReference;

      update_book = _.pick(book, BLOCKS);

      console.log(update_book);

      commands.push({ update: {_id: recordReference, _type: "print_book", _index: "books", _retry_on_conflict: 3} })
      commands.push({doc: update_book});

    })

    client.bulk({body: commands}, function(err,resp){
      if (err) {
        console.error('WTF!!!');
      } else {
        callback(files[i] + " " + (i + 1) + "/" + files.length);
        if ((i+1) < files.length){
          bulk(files,i+1, function(res){
            console.info(res);
          });
        }else{
          console.info("Done!");
          process.exit();
        }
      }
    });

  });

}

bulk(files,0, function(res){
  console.info(res);
});