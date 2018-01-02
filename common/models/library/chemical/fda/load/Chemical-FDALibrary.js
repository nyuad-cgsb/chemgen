'use strict';

const app = require('../../../../../../server/server');
const Promise = require('bluebird');

const ChemicalFdalibrary = app.models.ChemicalFdalibrary;

//TODO This whole workflow is the same across libraries - we just need to do some cleaning up first

ChemicalFdalibrary.load.workflows.processExperimentPlates = function(workflowData, plateInfoList) {
  return new Promise(function(resolve, reject) {
    Promise.map(plateInfoList, function(plateInfo) {
        return ChemicalFdalibrary.load.workflows.createStock(workflowData, plateInfo);
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

ChemicalFdalibrary.load.workflows.createStock = function(workflowData, plateInfo) {
  var barcode = plateInfo.ExperimentExperimentplate.barcode;
  var stage = workflowData.screenStage;
  var get = 'getParentLibrary';

  return new Promise(function(resolve, reject) {
    ChemicalFdalibrary.extract[stage][get](workflowData, barcode)
      .then(function(libraryResults) {
        return ChemicalFdalibrary.extract
          .parseLibraryResults(workflowData, plateInfo, libraryResults);
      })
      .then(function(parsedLibraryResults) {
        return ChemicalFdalibrary.load
          .createLibraryStocks(parsedLibraryResults);
      })
      .then(function(libraryDataList) {
        resolve({
          plateInfo: plateInfo,
          libraryDataList: libraryDataList,
        });
      })
      .catch(function(error) {
        app.winston.warn(error.stack);
        reject(new Error(error));
      });
  });
};

ChemicalFdalibrary.load.createLibraryStocks = function(dataList) {
  return new Promise(function(resolve, reject) {
    Promise.map(dataList, function(data) {
        var createObj = data.libraryStock;

        return app.models.ChemicalLibrarystock
          .findOrCreate({
            where: app.etlWorkflow.helpers.findOrCreateObj(createObj),
          }, createObj)
          .then(function(results) {
            var result = results[0];
            debugger;
            var resultData = {
              libraryStock: result,
              libraryParent: data.libraryParent,
              fdalibraryId: createObj.fdalibraryId,
              taxTerm: createObj.taxTerm,
            };
            resultData.libraryStock.taxTerms = createObj.taxTerms;
            resultData.libraryStock.taxTerm = createObj.taxTerm;
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
