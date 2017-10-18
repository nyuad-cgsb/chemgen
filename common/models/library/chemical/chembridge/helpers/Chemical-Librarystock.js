'use strict';

const app = require('../../../../../../server/server');
const Promise = require('bluebird');

const ChemicalLibrarystock = app.models.ChemicalLibrarystock;

ChemicalLibrarystock.helpers.parseCond = function() {
  return 'None';
};

ChemicalLibrarystock.helpers.buildControlTag = function(barcode) {
  return 'None';
};
