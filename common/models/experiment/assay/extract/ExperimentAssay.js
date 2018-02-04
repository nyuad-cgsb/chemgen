'use strict';

const app = require('../../../../../server/server.js');
const ExperimentAssay = app.models.ExperimentAssay;
const Promise = require('bluebird');

// libraryModel: 'ChemicalFdalibrary',
// libraryStockModel: 'ChemicalLibrarystock',

ExperimentAssay.extract.getParentStockId = function(workflowData, assayId) {
  return new Promise(function(resolve, reject) {
    ExperimentAssay.findOne({
        where: {
          assayId: assayId
        }
      })
      .then(function(results) {
        return app.models[workflowData.libraryStockModel]
          .findOne({
            where: {
              librarystockId: results.reagentId,
            }
          })
      })
      .then(function(results) {
        var libraryId = workflowData.libraryId;
        var where = {};
        where[libraryId] = results.parentstockId;
        return app.models[workflowData.libraryModel].findOne({where: where});
      })
      .then(function(results){
        resolve(results);
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        reject(new Error(error));
      });
  });
};

ExperimentAssay.extract.getScreenId = function(workflowData, assayId) {
  return new Promise(function(resolve, reject) {
    ExperimentAssay.findOne({
        where: {
          assayId: assayId
        }
      })
      .then(function(results) {
        return app.models.ExperimentExperimentplate
          .findOne({
            where: {
              experimentPlateId: results.plateId,
            }
          })
      })
      .then(function(results) {
        return app.models.MainScreen.findOne({
          where: {
            screenId: results.screenId
          }
        })
      })
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        reject(new Error(error));
      });
  });

};
