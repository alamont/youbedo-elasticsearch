require('./csv2json.js');
fs = require('fs');
elasticsearch = require('elasticsearch');
var sync = require('synchronize');

var serverOptions = {
    host: 'youbedo:foldyourbooks@09cef314ab007c8a000.qbox.io:80',
    log: 'warning'
};

var client = new elasticsearch.Client(serverOptions);

files = fs.readdirSync('/Users/Andres/SkyDrive/Orikami/Youbedo/Dump');
files = files.filter(function(f){return f.search(/.csv$/i) >= 0});
console.log(files)
sync(client, 'bulk');
sync(parseCSV);

sync.fiber(function(){
  files.forEach(function(file){

    data = fs.readFileSync("/Users/Andres/SkyDrive/Orikami/Youbedo/Dump/" + file, 'utf8');

    // books = parseCSV(data, function(dummy){return dummy});
    books = sync.await(parseCSV(data, sync.defer()));

    commands = [];
    var i = 0;
    var j = 0;
    books.forEach(function (item) {
      recordReference = item.RecordReference;
      commands.push({ index : { _index :"books", _type : "print_book", _id: recordReference } });
      commands.push(item);
      i = i + 1;
      if (i == 1000){
        j = j + 1;
        resp = sync.await(client.bulk({body: commands},sync.defer()));
        console.info("Batch " + j + " " + file);
        commands = [];
        i = 0;
      }
    });
    books = null;
    commands = null;

  });
});
