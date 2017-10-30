'use strict';

module.exports = function(ChemicalLibrarystock) {
  ChemicalLibrarystock.load = {};
  ChemicalLibrarystock.extract = {};
  ChemicalLibrarystock.load.workflows = {};
  ChemicalLibrarystock.extract.workflows = {};
  ChemicalLibrarystock.extract.Primary = {};

  ChemicalLibrarystock.helpers = {};
  ChemicalLibrarystock.on('attached', function(obj) {
    require('../helpers/Chemical-Librarystock');
  });
};
