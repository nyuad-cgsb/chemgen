'use strict';

const app = require('../../../../../../../server/server.js');
const Promise = require('bluebird');
const RnaiLibrarystock = app.models.RnaiLibrarystock;

/**
 * Primary
 **/

// Secondary screens are custom created based on a gene set of interest
// They are handed over to me in an excel sheet, which I export to JSON and it gets saved in the 'screen' table.
// Each well has a location representation - which is either the vendor library (length = 3)
// Or the stock library (length = 4 to include a quadrant)
// TODO THIS IS A WORKFLOW
RnaiLibrarystock.extract.Primary.getParentLibrary = function(workflowData, barcode) {
  return new Promise(function(resolve, reject) {
    RnaiLibrarystock.extract.Primary.getLibraryInfo(workflowData, barcode)
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        reject(new Error(error));
      });
  });
};

RnaiLibrarystock.extract.Primary.getLibraryInfo = function(workflowData, barcode) {
  var quadrant = RnaiLibrarystock.helpers.getQuad(barcode);
  var plate = RnaiLibrarystock.helpers.getPlate(workflowData.RnaiPlateNo);
  var chrom = workflowData.chrom;
  var stockTitle = chrom + '-' + plate + '--' + quadrant;

  return new Promise(function(resolve, reject) {
    app.models.RnaiRnailibrary
        .find({
          where: {
            stocktitle: chrom + '-' + plate + '--' + quadrant,
          },
        })
        .then(function(results) {
          resolve(results);
        })
        .catch(function(error) {
          reject(new Error(error));
        });
  });
};

  // //TODO Standard and Custom Plates
  // RnaiLibrarystock.getLibraryInfo = function(FormData, barcode) {
  //   console.log('In Main getLibraryInfo');
  //   var quadrant = RnaiLibrarystock.getQuad(barcode);
  //   var plate = RnaiLibrarystock.getPlate(FormData.RnaiPlateNo);
  //   var chrom = FormData.chrom;
  //   var stockTitle = chrom + '-' + plate + '--' + quadrant;
  //
  //   return new Promise(function(resolve, reject) {
  //     app.models.RnaiRnailibrary
  //       .find({
  //         where: {
  //           stocktitle: chrom + '-' + plate + '--' + quadrant,
  //         },
  //       })
  //       .then(function(results) {
  //         resolve(results);
  //       })
  //       .catch(function(error) {
  //         reject(new Error(error));
  //       });
  //   });
  // };

  // RnaiLibrarystock.getParentLibrary = function(FormData, barcode) {
  //   //Check
  //   return new Promise(function(resolve, reject) {
  //     RnaiLibrarystock.getLibraryInfo(FormData, barcode)
  //       .then(function(results) {
  //         resolve(results);
  //       })
  //       .catch(function(error) {
  //         reject(new Error(error));
  //       });
  //   });
  // };


  // RnaiLibrarystock.processCreateStock = function(queueObj, done) {
  //   var FormData = queueObj.FormData;
  //   var plateInfo = queueObj.plateInfo;
  //   var barcode = plateInfo.ExperimentExperimentplate.barcode;
  //
  //   RnaiLibrarystock.getParentLibrary(FormData, barcode)
  //     .then(function(results) {
  //       return RnaiLibrarystock.preProcessLibraryResults({
  //         ExperimentExperimentplate: plateInfo,
  //         libraryResults: results,
  //         FormData: FormData,
  //       });
  //     })
  //     .then(function(results) {
  //       return RnaiLibrarystock.createRnaiLibraryStocks(results);
  //     })
  //     .then(function(results) {
  //       return RnaiLibrarystock.postProcessStockKue(queueObj, results);
  //     })
  //     .then(function(results) {
  //       done();
  //     })
  //     .catch(function(error) {
  //       done(new Error(error.stack));
  //     });
  // };
