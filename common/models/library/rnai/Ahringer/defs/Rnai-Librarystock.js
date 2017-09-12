'use strict';

module.exports = function(RnaiLibrarystock) {
  const Promise = require('bluebird');
  const app = require('../../../../../../server/server');
  var _ = require('lodash');
  var slug = require('slug');

  RnaiLibrarystock.Primary = {};
  RnaiLibrarystock.Secondary = {};
  RnaiLibrarystock.Custom = {};

  RnaiLibrarystock.load = {};
  RnaiLibrarystock.load.Primary = {};
  RnaiLibrarystock.load.Secondary = {};
  RnaiLibrarystock.load.Custom = {};

  RnaiLibrarystock.extract = {};
  RnaiLibrarystock.extract.Primary = {};
  RnaiLibrarystock.extract.Secondary = {};
  RnaiLibrarystock.extract.Custom = {};

  RnaiLibrarystock.on('attached', function(obj) {
    require('../extract/secondary/Rnai-Librarystock.js');
  });

  /**
   * Create the ExperimentExperimentPlate
   * TODO merge this function with createExperimentPlate
   * @param  {[type]} plate [description]
   * @return {[type]}       [description]
   */
  RnaiLibrarystock.processVendorPlate = function(workflowData, plate) {
    return new Promise(function(resolve, reject) {
      var temp = RnaiLibrarystock.getTemp(plate.platebarcode, workflowData);

      plate.barcode = plate.name;
      plate.plateStartTime = plate.platestarttime;
      plate.imagePath = plate.imagepath;
      plate.creationDate = plate.creationdate;
      FormData.temperature = temp;

      resolve(plate);
    //   app.models.ExperimentExperimentplate.kue({
    //     FormData: FormData,
    //     plateInfo: plate,
    //   })
    //     .then(function(results) {
    //       resolve(results);
    //     })
    //     .catch(function(error) {
    //       reject(new Error(error));
    //     });
    });
  };

  //THIS IS A WORKFLOW
  RnaiLibrarystock.processVendorPlates = function(data, done) {
    var FormData = data.FormData;
    var plates = data.plates;

    Promise.map(plates, function(plate) {
      return RnaiLibrarystock.processVendorPlate(FormData, plate);
    }, {
      concurrency: 3,
    })
      .then(function(results) {
        done();
      })
      .catch(function(error) {
        done(new Error(error));
      });
  };

};
