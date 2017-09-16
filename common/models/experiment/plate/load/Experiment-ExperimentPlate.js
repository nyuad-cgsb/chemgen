'use strict';

  const Promise = require('bluebird');
  const app = require('../../../../../server/server');
  const ExperimentExperimentplate = app.models.ExperimentExperimentplate;

  /**
   * Create the experiment plate
   * Carry around an object that has vendorPlate data and ExperimentExperimentplate data
   * TODO create specific instances per library
   * TODO CLEAN THIS UP!
   * @param  {Object} createObj [description]
   * @return {Promise<Token>}           [ExperimentExperimentplate Result]
   */
  ExperimentExperimentplate.load.createExperimentPlate = function(workflowData, vendorPlate) {
    vendorPlate.barcode = vendorPlate.name;
    vendorPlate.plateStartTime = vendorPlate.platestarttime;
    vendorPlate.imagePath = vendorPlate.imagepath;
    vendorPlate.plateCreationDate = vendorPlate.creationdate;

    var createObj = genExperimentPlate(workflowData, vendorPlate);

    return new Promise(function(resolve, reject) {
      ExperimentExperimentplate
        .findOrCreate({
          where: app.etlWorkflow.helpers.findOrCreateObj(createObj),
        }, createObj)
        .then(function(result) {
          result = result[0];
          result.imagePath = createObj.imagePath;
          result.plateStartTime = createObj.plateStartTime;
          var retObj = {
            ExperimentExperimentplate: {
              barcode: result.barcode,
              experimentPlateId: result.experimentPlateId,
              imagePath: createObj.imagePath,
              plateStartTime: createObj.plateStartTime,
              instrumentId: result.instrumentId,
              instrumentPlateId: result.instrumentPlateId,
              screenId: result.screenId,
              screenStage: result.screenStage,
              temperature: result.temperature,
              title: createObj.title,
            },
            vendorPlate: vendorPlate,
          };
          resolve(retObj);
        })
        .catch(function(error) {
          app.winston.warn('ERROR ' + JSON.stringify(error));
          reject(new Error(error));
        });
    });
  };

ExperimentExperimentplate.load.workflows.processVendorPlates = function(workflowData, vendorPlates) {
  return new Promise(function(resolve, reject) {
    Promise.map(vendorPlates, function(plate) {
        return ExperimentExperimentplate.load.createExperimentPlate(workflowData, plate);
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

  var genExperimentPlate = function(workflowData, vendorPlate){

    var createObj = {
      imagePath: vendorPlate.imagePath,
      screenId: workflowData.screenId,
      barcode: vendorPlate.barcode,
      screenStage: workflowData.screenStage,
      instrumentId: workflowData.instrumentId,
      instrumentPlateId: vendorPlate.csPlateid,
      plateStartTime: vendorPlate.plateStartTime,
      plateCreationDate: vendorPlate.creationDate,
    };

    return createObj;
  };
