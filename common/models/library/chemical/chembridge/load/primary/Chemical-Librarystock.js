'use strict';

const app = require('../../../../../../../server/server');
const Promise = require('bluebird');

const ChemicalLibrarystock = app.models.ChemicalLibrarystock;

ChemicalLibrarystock.extract.Primary.getParentLibrary = function(workflowData, barcode) {
  return new Promise(function(resolve, reject) {
    ChemicalLibrarystock.extract.Primary.getLibraryInfo(workflowData, barcode)
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        reject(new Error(error));
      });
  });
};

ChemicalLibrarystock.extract.Primary.getLibraryInfo = function(workflowData, barcode) {
  var plateObj = app.models.ChemicalChembridgelibrary
    .helpers.parseBarcode(barcode);

  return new Promise(function(resolve, reject) {
    app.models.ChemicalChembridgelibrary
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
