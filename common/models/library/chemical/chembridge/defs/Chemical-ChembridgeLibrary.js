'use strict';

module.exports = function(ChemicalChembridgelibrary) {
  ChemicalChembridgelibrary.load = {};
  ChemicalChembridgelibrary.extract = {};
  ChemicalChembridgelibrary.load.workflows = {};
  ChemicalChembridgelibrary.extract.workflows = {};
  ChemicalChembridgelibrary.extract.Primary = {};

  ChemicalChembridgelibrary.helpers = {};

  ChemicalChembridgelibrary.on('attached', function(obj) {
    require('../load/Chemical-ChembridgeLibrary');
    require('../load/primary/Chemical-ChembridgeLibrary');
    require('../extract/Chemical-ChembridgeLibrary');
    require('../helpers/Chemical-ChembridgeLibrary');
  });
};
