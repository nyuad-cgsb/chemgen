'use strict';

var jsonfile = require('jsonfile');
var file = '/home/jillian/Dropbox/projects/NY/chemgen/chemgen-loopback-new/server/model-config.json';
// var things = require(file);
// console.log('things are ' + JSON.stringify(things));
//
jsonfile.readFile(file, function(err, obj) {
  console.log(obj);
  console.log('error is ' + JSON.stringify(err));
});
