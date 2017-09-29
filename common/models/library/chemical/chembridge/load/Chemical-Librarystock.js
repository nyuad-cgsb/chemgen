'use strict';

const app = require('../../../../../../server/server');
const Promise = require('bluebird');

const ChemicalLibrarystock = app.models.ChemicalLibrarystock;

ChemicalLibrarystock.load.workflows.processExperimentPlates = function(workflowData, plateInfoList) {
  return new Promise(function(resolve, reject) {
    Promise.map(plateInfoList, function(plateInfo) {
        return ChemicalLibrarystock.load.workflows.createStock(workflowData, plateInfo);
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

ChemicalLibrarystock.load.workflows.createStock = function(workflowData, plateInfo) {
  var barcode = plateInfo.ExperimentExperimentplate.barcode;
  var stage = workflowData.screenStage;
  var get = 'getParentLibrary';

  return new Promise(function(resolve, reject) {
    ChemicalLibrarystock.extract[stage][get](workflowData, barcode)
      .then(function(libraryResults) {
        return ChemicalLibrarystock.extract
          .parseLibraryResults(workflowData, plateInfo, libraryResults);
      })
      .then(function(parsedLibraryResults) {
        return ChemicalLibrarystock.load
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

ChemicalLibrarystock.load.createLibraryStocks = function(dataList) {
  return new Promise(function(resolve, reject) {
    Promise.map(dataList, function(data) {
        var createObj = data.libraryStock;
        return ChemicalLibrarystock
          .findOrCreate({
            where: app.etlWorkflow.helpers.findOrCreateObj(createObj),
          }, createObj)
          .then(function(results) {
            var result = results[0];
            var resultData = {
              libraryStock: result,
              libraryParent: data.libraryParent,
              chembridgelibraryId: createObj.chembridgelibraryId,
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
