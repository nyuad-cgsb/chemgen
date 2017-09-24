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
  var plate = RnaiLibrarystock.helpers.getPlate(workflowData.search.library.rnai.ahringer.RnaiPlateNo);
  var chrom = workflowData.search.library.rnai.ahringer.chrom;
  var stockTitle = chrom + '-' + plate + '--' + quadrant;
  var where =  {
    stocktitle: chrom + '-' + plate + '--' + quadrant,
  };

  return new Promise(function(resolve, reject) {
    app.models.RnaiRnailibrary
        .find({
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
