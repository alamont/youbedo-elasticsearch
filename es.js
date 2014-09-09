var fs = require('fs');
elasticsearch = require('elasticsearch');
Util = require('util');
_ = require('underscore');
require('./onx.js');

var serverOptions = {
    host: 'youbedo:foldyourbooks@09cef314ab007c8a000.qbox.io:80',
    log: 'warning'
};

const BLOCKS = ["DescriptiveDetail", "CollateralDetail", "ContentDetail", "PublishingDetail", "RelatedMaterial", "ProductSupply"];

// var serverOptions = {
//     host: 'localhost:9200',
//     log: 'trace'
// };

var client = new elasticsearch.Client(serverOptions);

updateBooks = function(onx_string, callback){
  parseOnx(onx_string, function(data) {

    books = data.ONIXMessage.Product;
    commands = [];
    books.forEach(function (book) {

      recordReference = book.RecordReference;

      update_book = _.pick(book, BLOCKS);

      console.log(update_book);

      commands.push({ update: {_id: recordReference, _type: "print_book", _index: "books", _retry_on_conflict: 3} })
      commands.push({doc: update_book});

    })

    callback(true);

  });
}