'use strict';

module.exports = function(Plate) {
  const Promise = require('bluebird');
  const app = require('../../../../server/server');

  Plate.search = function(where) {
    return new Promise(function(resolve, reject) {
      Plate.find({
        where: where,
      })
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        reject(new Error(error));
      });
    });
  };

  /**
   * Get a Chemical Library Plate by doing PlateStart, PlateEnd
   * TODO move this over to ChemicalLibrary
   * TODO Name this getRange
   * For Chemical Library
   * @param  {[type]} plate [description]
   * @return {[type]}       [description]
   */
  Plate.getList = function(plate) {
    return new Promise(function(resolve, reject) {
      Plate.find({
        where: {
          csPlateid: {
            between: [plate.plateStart, plate.plateEnd],
          },
        },
      })
        .then(function(results) {
          var plateIds = Plate.processPlateResults(results);
          resolve(plateIds);
        })
        .catch(function(error) {
          reject(new Error(error));
        });
    });
  };

  Plate.processPlateResults = function(results) {
    var plateIds = results.map(function(obj) {
      var plateObj = {};
      plateObj.plateStartTime = obj.platestarttime;
      plateObj.csPlateid = obj.csPlateid;
      plateObj.barcode = obj.name;
      plateObj.imagePath = obj.imagepath;
      return plateObj;
    });
    return plateIds;
  };

  /**
   * Take the array of PlateResultSets, add an interval, and the original FormData
   * @param  {Array<Object>} plateListResults PlateResultSets
   * @return {Array<Object>}                  PlateResultSets + additional metadata
   */
  Plate.populateExperimentPlate = function(FormData, plateListResults) {
    return new Promise(function(resolve, reject) {
      Promise.map(plateListResults, function(plateInfo, index) {
        var interval = 60000 * (index + 1);
        var input = {
          FormData: FormData,
          plateInfo: plateInfo,
          interval: interval,
        };
        return input;
      })
        .then(function(inputs) {
          resolve(inputs);
        })
        .catch(function(error) {
          reject(error);
        });
    });
  };

  /**
   * Submit our plateObjects to the queue
   * @param  {Array<Object>} inputs Array of objects containing metadata for our ExperimentExperimentplate.kue
   * @return {Array<Object>}       Resolves the createObj from the kue
   */
  Plate.submitKue = function(inputs) {
    return new Promise(function(resolve, reject) {
      Promise.map(inputs, function(input) {
        return app.models.ExperimentExperimentplate.kue(input);
      })
        .then(function(results) {
          resolve(results);
        })
        .catch(function(error) {
          reject(error);
        });
    });
  };

  /**
   * For a range plateX-plateY, get the plate data
   * Preprocess each plate element - add in information the kue expects
   * @param  {Array<Object>} plates [{plateStart: 1, plateEnd: 4}]
   * @return {Array<Object>}        plateData in the format submitKue expects
   */
  Plate.preProcessPlateList = function(FormData) {
    var plates = FormData.plates;
    return new Promise(function(resolve, reject) {
      Promise.map(plates, function(plate) {
        return Plate.getList(plate);
      })
        .then(function(plateListResults) {
          return Plate.populateExperimentPlate(FormData, plateListResults[0]);
        })
        .then(function(experimentPlateData) {
          resolve(experimentPlateData);
        })
        .catch(function(error) {
          reject(error);
        });
    });
  };

  /**
   * Start the initial workflow for processing plates
   * @param  {Object} FormData [See test/helpers.js for the FormData object]
   * @return {Promise<submitKueResults>}          [Returns an array of promises of results from the submitKue function]
   */
  Plate.processFormData = function(FormData) {
    return new Promise(function(resolve, reject) {
      Plate.preProcessPlateList(FormData.plates)
        .then(function(results) {
          return Plate.submitKue(results);
        })
        .then(function(results) {
          resolve(results);
        })
        .catch(function(error) {
          reject(new Error(error));
        });
    });
  };
};
