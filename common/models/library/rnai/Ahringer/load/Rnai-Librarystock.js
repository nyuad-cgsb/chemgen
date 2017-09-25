'use strict';

const app = require('../../../../../../server/server');
const Promise = require('bluebird');
const RnaiLibrarystock = app.models.RnaiLibrarystock;
const _ = require('lodash');

/**
There is only one workflow here - the workflow that creates a stock.

We have a stock plate, and have to map this back to the parent plate from the
library.

For secondary screens these are written in an excel spreadsheet, but for primary
screens we need a lookup.
**/

RnaiLibrarystock.load.workflows.createStock = function(workflowData, plateInfo) {
  var barcode = plateInfo.ExperimentExperimentplate.barcode;

  return new Promise(function(resolve, reject) {
    RnaiLibrarystock['extract'][workflowData.screenStage]['getParentLibrary'](workflowData, barcode)
      .then(function(libraryResults) {
        return RnaiLibrarystock.extract.parseLibraryResults(workflowData, plateInfo, libraryResults);
      })
      .then(function(parsedLibraryResults) {
        return RnaiLibrarystock.load.createRnaiLibraryStocks(parsedLibraryResults);
      })
      .then(function(libraryDataList) {
        resolve({
          plateInfo: plateInfo,
          libraryDataList: libraryDataList
        });
      })
      .catch(function(error) {
        app.winston.warn(error.stack);
        reject(new Error(error));
      });
  });
};

RnaiLibrarystock.load.createRnaiLibraryStocks = function(dataList) {
  return new Promise(function(resolve, reject) {
    Promise.map(dataList, function(data) {
        var createObj = data.libraryStock;

        return RnaiLibrarystock
          .findOrCreate({
            where: app.etlWorkflow.helpers.findOrCreateObj(createObj),
          }, createObj)
          .then(function(results) {
            var result = results[0];
            var resultData = {
              libraryStock: result,
              libraryParent: data.libraryParent,
              geneName: createObj.geneName,
            };
            resultData.libraryStock.taxTerms = createObj.taxTerms;
            resultData.libraryStock.geneName = createObj.geneName;
            resultData.libraryStock.taxTerm = createObj.geneName;
            return resultData;
          });
      })
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        reject(new Error(error));
      });
  });
};

RnaiLibrarystock.load.workflows.processExperimentPlates = function(workflowData, plateInfoList) {
  return new Promise(function(resolve, reject) {
    Promise.map(plateInfoList, function(plateInfo) {
        return RnaiLibrarystock.load.workflows.createStock(workflowData, plateInfo);
      }, {
        concurrency: 1,
      })
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        app.winston.warn(error.stack);
        reject(new Error(error));
      });
  });
};

RnaiLibrarystock.genLibraryResult = function(barcode, libraryResults, well) {
  var libraryResult = {};
  if (barcode.match('L4440')) {
    libraryResult.name = 'L4440';
    libraryResult.geneName = 'L4440';
  } else {
    // I'm sure I use the quadrant for something  - just not sure what
    var quadrant = RnaiLibrarystock.helpers.getQuad(barcode);
    libraryResult = _.find(libraryResults, {
      well: well,
    });
  }

  libraryResult = RnaiLibrarystock.helpers.checkLibraryResult(libraryResult);

  return libraryResult;
};
