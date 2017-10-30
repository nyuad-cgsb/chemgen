'use strict';

const app = require('../../../../../../../server/server');
const Promise = require('bluebird');

const ChemicalChembridgelibrary = app.models.ChemicalChembridgelibrary;

ChemicalChembridgelibrary.extract.Primary.getParentLibrary = function(workflowData, barcode) {
  return new Promise(function(resolve, reject) {
    ChemicalChembridgelibrary.extract.Primary.getLibraryInfo(workflowData, barcode)
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        reject(new Error(error));
      });
  });
};

ChemicalChembridgelibrary.extract.Primary.getLibraryInfo = function(workflowData, barcode) {
  var plateObj = ChemicalChembridgelibrary
    .helpers.parseBarcode(barcode);

  return new Promise(function(resolve, reject) {
    ChemicalChembridgelibrary
      .find({
        where: {
          plate: plateObj.plateName,
        },
      })
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        reject(error);
      });
  });
};
