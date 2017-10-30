var path = require('path');
var Promise = require('bluebird');
var fs = require('fs');
var loopback = require('loopback');

const app = require('../server/server');
var datasource = app.datasources.chemgenDS;
//var datasource = app.datasources.wordpressDS;
//var datasource = app.datasources.arrayscanDS;
var outputPath = path.resolve(__dirname, '_chemgenModels');

//var modelConfig = {};
//modelConfig[table] = {
//'datasource': 'chemgenDS'
//};

datasource.discoverModelDefinitions(function(err, models) {
	console.log(JSON.stringify(models));

  models.forEach(function(def) {
    // def.name ~ the model name
    datasource.discoverSchema(def.name, null, function(err, results) {
      table = def.name;
      console.log(table);

      table = table.replace(/_/g, "-");

      var outputFile = outputPath + "/" + table + ".json"

      console.log("Output file" + outputFile);
      var json = JSON.stringify(results, null, '  ');

      fs.writeFile(outputFile, JSON.stringify(results, null, 2), function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("JSON saved to " + outputFile);
        }
      });
    });

  });

//var json = JSON.stringify(modelConfig, null, '  ');
//console.log(json);
//datasource.disconnect();
});
