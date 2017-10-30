'use strict';

// ChemicalFdalibrary

module.exports = function(ChemicalFdalibrary) {
  ChemicalFdalibrary.Primary = {};
  ChemicalFdalibrary.Secondary = {};
  ChemicalFdalibrary.Custom = {};
  ChemicalFdalibrary.workflows = {};
  ChemicalFdalibrary.helpers = {};
  ChemicalFdalibrary.helpers.buildControlTag = {};

  ChemicalFdalibrary.load = {};
  ChemicalFdalibrary.load.workflows = {};
  ChemicalFdalibrary.load.Primary = {};
  ChemicalFdalibrary.load.Secondary = {};
  ChemicalFdalibrary.load.Custom = {};

  ChemicalFdalibrary.extract = {};
  ChemicalFdalibrary.extract.workflows = {};
  ChemicalFdalibrary.extract.Primary = {};
  ChemicalFdalibrary.extract.Secondary = {};
  ChemicalFdalibrary.extract.Custom = {};

  ChemicalFdalibrary.on('attached', function(obj) {
    require('../extract/secondary/Chemical-FDALibrary.js');
    // require('../extract/primary/Chemical-FDALibrary.js');
    require('../load/Chemical-FDALibrary.js');
    require('../extract/Chemical-FDALibrary.js');
    require('../helpers/Chemical-FDALibrary.js');
  });
};
