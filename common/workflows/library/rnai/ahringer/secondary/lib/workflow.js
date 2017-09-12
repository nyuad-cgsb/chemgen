'use strict';
const app = require('../../../../../../../server/server.js');
const Promise = require('bluebird');
const fs = require('fs');
const readFile = Promise.promisify(require('fs')
  .readFile);
const jsonfile = require('jsonfile');

var rows = app.etlWorkflow.helpers.rows;
var cols = app.etlWorkflow.helpers.cols;
var file = '';
var like = 'rnai%';

// TODO Move all of these over to the Secondary model things
// This portion corresponds to the RnaiLibrarystock.getParentLibrary function
// Workflow.data
var getParentLibrary = function(file) {
  return new Promise(function(resolve, reject) {
    readFile(file, 'utf8')
      .then(function(contents) {
        return JSON.parse(contents);
      })
      .then(function(results) {
        return parseCustomPlate(results);
      })
      .then(function(results) {
        return parseRows(results);
      })
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        console.log('error ' + JSON.stringify(error));
        reject(new Error(error));
      });
  });
};

// This one takes in our custom plate data
var parseCustomPlate = function(data) {
  var list = [];
  rows.map(function(row) {
    var obj = data[row];
    for (var key in obj) {
      var dataObj = {};
      var lookUp = obj[key];
      var newKey = ('00' + key)
        .slice(-2);
      if (lookUp) {
        var splitLookUp = lookUp.split('\n');
        dataObj['splitLookUp'] = splitLookUp;
        dataObj['row'] = row;
        dataObj['origKey'] = key;
        dataObj['assayWell'] = row + newKey;
        list.push(dataObj);
      }
    }
  });

  return new Promise(function(resolve) {
    resolve(list);
  });
};

var parseRows = function(lists) {
  return new Promise(function(resolve, reject) {
    Promise.map(lists, function(wellData) {
      return parseWell(wellData);
    })
    .then(function(results) {
      return Promise.resolve(results);
    })
    .catch(function(error) {
      console.log('error ' + JSON.stringify(error));
      return Promise.reject(new Error(error));
    });
  });
};

var parseWell = function(wellData, loopUpIndex, commentIndex) {
  return new Promise(function(resolve, reject) {
    var obj = {
      wellData: wellData,
    };
    var data,
      comment;
    if (wellData.splitLookUp[0].match('L4440')) {
      obj.geneName = 'L4440';
      obj.well = wellData.assayWell;
      resolve(obj);
    } else {
      data = wellData.splitLookUp[loopUpIndex];
      comment = wellData.splitLookUp[commentIndex];
    }
  // TODO Make this FormData
    var where = {};

  // Its not a control
    var lookUp = data.split('-');
    var chrom = lookUp[0];
    var plateNo = lookUp[1];
    var well = '';
  // The well listed is from the parent library - not the stock
    if (lookUp.length === 3) {
      well = lookUp[2];
      var bioLoc = chrom + '-' + plateNo + well;
      where = {
        bioloc: bioLoc,
      };
    // The well is from the stock - it has a quadrant
    } else if (lookUp.length === 4) {
      var quad = lookUp[2];
      well = lookUp[3];
      where = {
        and: [{
          stocktitle: chrom + '-' + plateNo + '--' + quad,
        },
        {
          stockloc: quad + '-' + well,
        },
        {
          well: well,
        },
        ],
      };
    } else {
      reject(new Error());
    }

    app.models.RnaiRnailibrary.search(where)
    .then(function(tresults) {
      var results = tresults[0];
      results.wellData = wellData;
      results.origWell = results.well;
      results.well = wellData.assayWell;
      results.comment = comment;
      resolve(results);
    })
    .catch(function(error) {
      reject(new Error(error.stack));
    });
  });
};

app.models.RnaiLibrarystock.getParentLibrary = function(FormData, barcode) {
  return new Promise(function(resolve, reject) {
    getParentLibrary(file)
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        reject(new Error(error));
      });
  });
};

var findInstrumentPlates = {};
exports.findInstrumentPlates = findInstrumentPlates;
