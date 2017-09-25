'use strict';

const app = require('../../../../../../../server/server.js');
const Promise = require('bluebird');
const RnaiLibrarystock = app.models.RnaiLibrarystock;

/**
 * Secondary
 **/

// Secondary screens are custom created based on a gene set of interest
// They are handed over to me in an excel sheet, which I export to JSON and it gets saved in the 'screen' table.
// Each well has a location representation - which is either the vendor library (length = 3)
// Or the stock library (length = 4 to include a quadrant)
// TODO THIS IS A WORKFLOW
RnaiLibrarystock.extract.Secondary.getParentLibrary = function(workflowData) {
  return new Promise(function(resolve, reject) {
    RnaiLibrarystock.extract.Secondary.parseCustomPlate(workflowData)
      .then(function(results) {
        return RnaiLibrarystock.extract.Secondary.parseRows(workflowData, results);
      })
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        reject(new Error(error));
      });
  });
};

var buildRnaiLibraryWhere = function(lookUp) {
  var where = {};
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
    return;
  }
  return where;
};

var parseWell = function(workflowData, wellData) {
  var lookUpIndex = workflowData.search.library.rnai.ahringer.lookUpIndex;
  var commentIndex = workflowData.search.library.rnai.ahringer.commentIndex;

  return new Promise(function(resolve, reject) {
    var obj = {
      wellData: wellData,
    };
    // If its a control just return right here
    if (wellData.splitLookUp[0].match('L4440')) {
      obj.geneName = 'L4440';
      obj.well = wellData.assayWell;
      resolve(obj);
    } else {
      var data,
        comment;
      data = wellData.splitLookUp[lookUpIndex];
      comment = wellData.splitLookUp[commentIndex];
      var lookUp = data.split('-');
      var where = buildRnaiLibraryWhere(lookUp);

      if (!where) {
        reject(new Error('Not able to find a corresponding library well!'));
      } else {
        app.models.RnaiRnailibrary.find({
            where: where,
          })
          .then(function(tresults) {
            if (!tresults[0]) {
              resolve();
            } else {
              var results = tresults[0];
              results.wellData = wellData;
              results.origWell = results.well;
              results.well = wellData.assayWell;
              results.comment = comment;
              resolve(results);
            }
          })
          .catch(function(error) {
            reject(new Error(error.stack));
          });
      }
    }
  });
};

RnaiLibrarystock.extract.Secondary.parseRows = function(workflowData, lists) {
  return new Promise(function(resolve, reject) {
    Promise.map(lists, function(wellData) {
        return parseWell(workflowData, wellData);
      })
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        reject(new Error(error));
      });
  });
};

// This parses the custom Plate
// That exists as a json file the library data directory
RnaiLibrarystock.extract.Secondary.parseCustomPlate = function(workflowData) {
  var wellData = workflowData.data.library.wellData;
  var rows = app.etlWorkflow.helpers.rows;
  var list = [];

  rows.map(function(row) {
    var obj = wellData[row];
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
