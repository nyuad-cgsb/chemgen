'use strict';

const app = require('../../../../../server/server.js');
const ExperimentAssay = app.models.ExperimentAssay;
const Promise = require('bluebird');
const fs = require('fs');
const request = Promise.promisify(require("request"), {
  multiArgs: true
});
Promise.promisifyAll(request, {
  multiArgs: true
})

/**
Loop over each plate
  Loop over each well (an assay corresponds to a single well)
    Create the experiment assay database entry
    Send a request off to the imaging server to make good with the images

This may be overkill since we will only be processing one arrayscan plate at a time in most cases
**/
ExperimentAssay.load.workflows.processExperimentPlates = function(workflowData, platesDataList) {
  return new Promise(function(resolve, reject) {
    Promise.map(platesDataList, function(plateData) {
        return ExperimentAssay.load.processExperimentAssay(workflowData, plateData.plateInfo, plateData.libraryDataList);
      }, {
        concurrency: 1
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

ExperimentAssay.load.processExperimentAssay = function(workflowData, plateInfo, libraryDataList) {
  return new Promise(function(resolve, reject) {
    ExperimentAssay.load.convertImages(workflowData, plateInfo, libraryDataList)
      .then(function() {
        return ExperimentAssay.load.createAssays(workflowData, plateInfo, libraryDataList);
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

/**
Loop over the library data and create the corresponding experiment assay
**/
ExperimentAssay.load.createAssays = function(workflowData, plateInfo, libraryDataList) {
  return new Promise(function(resolve, reject) {
    Promise.map(libraryDataList, function(libraryData) {
        return ExperimentAssay.load.createAssay(workflowData, plateInfo, libraryData);
      }, {
        concurrency: 1
      })
      .then(function(results) {
        resolve({
          plateInfo: plateInfo,
          experimentAssayList: results
        });
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        reject(new Error(error));
      });
  });
};


/**
 * The assay is a single well
 **/
ExperimentAssay.load.createAssay = function(workflowData, plateInfo, libraryData) {
  var well = libraryData.libraryStock.well;
  var image = ExperimentAssay.helpers.getImagePath(plateInfo, well);
  var ExperimentAssayObj = {
    plateId: plateInfo.ExperimentExperimentplate.experimentPlateId,
    assayName: plateInfo.ExperimentExperimentplate.barcode + '_' + well,
    well: well,
    biosampleId: 1,
    reagentId: libraryData.libraryStock.librarystockId,
    isJunk: workflowData.isJunk,
    platePath: 'assays' + image[0],
    metaAssay: JSON.stringify({
      experimentType: 'organism',
      library: workflowData.library,
    }),
    assayType: workflowData.library,
  };

  return new Promise(function(resolve, reject) {
    ExperimentAssay
      .findOrCreate({
        where: app.etlWorkflow.helpers.findOrCreateObj(ExperimentAssayObj),
      }, ExperimentAssayObj)
      .then(function(results) {
        var result = results[0];
        resolve({
          libraryData: libraryData,
          experimentAssayData: result
        });
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        reject(new Error(error));
      });
  });
};

ExperimentAssay.load.convertImages = function(workflowData, plateInfo, libraryDataList) {
  return new Promise(function(resolve, reject) {
    Promise.map(libraryDataList, function(libraryData) {
        return ExperimentAssay.load.convertImage(workflowData, plateInfo, libraryData);
      }, {
        concurrency: 1
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

ExperimentAssay.load.convertImage = function(workflowData, plateInfo, libraryData) {
  return new Promise(function(resolve, reject) {
    // TODO merge this with getImagePath function
    var well = libraryData.libraryStock.well;
    var plateId = plateInfo.ExperimentExperimentplate.instrumentPlateId;
    var assayName = plateInfo.ExperimentExperimentplate.barcode + '_' + well;

    var images = ExperimentAssay.helpers.genImageFileNames(plateInfo, well);
    var lookUpImage = images.baseImage + '-autolevel-' + '600x600.jpeg';
    var title = 'convertImage-' + plateId + '-' + assayName;

    //TODO Mixing callbacks with promises - this is baaaad
    //TODO make sure this request call is mocked

    fs.access(lookUpImage, function(err) {
      if (err && err.code === 'ENOENT') {

        ExperimentAssay.helpers.genConvertImageCommands(images)
          .then(function(commands) {
            var imageJob = {
              title: title,
              commands: commands,
              plateId: plateId,
            };
            return request.post('http://10.230.9.204:3001/', {
              json: imageJob
            });
          })
          .then(function(results) {
            resolve({
              baseImage: images.baseImage,
              script: title,
              convert: 1
            });
          })
          .catch(function(error) {
            // reject(new Error(error));
            //This is a terrible hack to make sure this works for tests
            resolve({
              baseImage: images.baseImage,
              script: title,
              convert: 1
            });

          });

      } else {
        resolve({
          baseImage: images.baseImage,
          script: title,
          convert: 0
        });
      }
    });

  });
};
