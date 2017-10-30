'use strict';

const app = require('../../../../../../../server/server.js');
const Promise = require('bluebird');
const ChemicalFdalibrary = app.models.ChemicalFdalibrary;

/**
TODO
Library.extract.Secondary.getParentLibrary
Is always the same workflow
Should be abstracted to ExperimentAssay
**/
ChemicalFdalibrary.extract.Secondary.getParentLibrary = function(workflowData) {
  return new Promise(function(resolve, reject) {
    ChemicalFdalibrary.extract.Secondary.parseCustomPlate(workflowData)
      .then(function(results) {
        return ChemicalFdalibrary.extract.Secondary.parseRows(workflowData, results);
      })
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        reject(new Error(error));
      });
  });
};

ChemicalFdalibrary.extract.Secondary.parseCustomPlate = function(workflowData) {
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
        dataObj['splitLookUp'] = lookUp;
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

//TODO This is a very general function
//Should just be in ExperimentAssay
ChemicalFdalibrary.extract.Secondary.parseRows = function(workflowData, lists) {
  return new Promise(function(resolve, reject) {
    Promise.map(lists, function(wellData) {
        return parseWell(workflowData, wellData);
      })
      .then(function(results) {
        // app.winston.info(JSON.stringify(results));
        results = cleanList(results);
        resolve(results);
      })
      .catch(function(error) {
        reject(new Error(error));
      });
  });
};

var cleanList = function(list) {
  for (var i = 0; i < list.length; i++) {
    if (list[i] === undefined) {
      list.splice(i, 1);
      i--;
    }
  }
  return list;
};

var parseWell = function(workflowData, wellData) {
  return new Promise(function(resolve, reject) {
    var obj = {
      wellData: wellData,
    };
    // If its a control just return right here
    if (wellData.splitLookUp.match('DMSO')) {
      obj.geneName = 'L4440';
      obj.taxTerm = 'L4440';
      obj.well = wellData.assayWell;
      resolve(obj);
    } else {
      var data = wellData.splitLookUp;
      var where = buildWhere(data);

      if (!where) {
        reject(new Error('Not able to find a corresponding library well!'));
      } else {
        ChemicalFdalibrary.find({
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
              results.taxTerm = results.fdalibraryId;
              results.comment = '';
              resolve(results);
            }
          })
          .catch(function(error) {
            reject(new Error(error));
          });
      }
    }
  });
};

var buildWhere = function(data) {
  var lookUp = data.split('-');
  var well = lookUp[1];
  var plate = lookUp[0];
  plate = ('00' + plate)
    .slice(-2);
  plate = '121212-' + plate;

  var where = {
    plate: plate,
    coordinate: well,
  };
  return where;
};
