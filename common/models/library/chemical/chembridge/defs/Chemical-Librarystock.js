'use strict';

module.exports = function(ChemicalLibrarystock) {
  ChemicalLibrarystock.load = {};
  ChemicalLibrarystock.extract = {};
  ChemicalLibrarystock.load.workflows = {};
  ChemicalLibrarystock.extract.workflows = {};
  ChemicalLibrarystock.extract.Primary = {};

  ChemicalLibrarystock.helpers = {};
  ChemicalLibrarystock.on('attached', function(obj) {
    require('../load/Chemical-Librarystock');
    require('../load/primary/Chemical-Librarystock');
    require('../extract/Chemical-Librarystock');
    require('../helpers/Chemical-Librarystock');
  });
};
