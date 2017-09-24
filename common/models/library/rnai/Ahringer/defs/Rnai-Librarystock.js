'use strict';

module.exports = function(RnaiLibrarystock) {
  RnaiLibrarystock.Primary = {};
  RnaiLibrarystock.Secondary = {};
  RnaiLibrarystock.Custom = {};
  RnaiLibrarystock.workflows = {};
  RnaiLibrarystock.helpers = {};

  RnaiLibrarystock.load = {};
  RnaiLibrarystock.load.workflows = {};
  RnaiLibrarystock.load.Primary = {};
  RnaiLibrarystock.load.Secondary = {};
  RnaiLibrarystock.load.Custom = {};

  RnaiLibrarystock.extract = {};
  RnaiLibrarystock.extract.workflows = {};
  RnaiLibrarystock.extract.Primary = {};
  RnaiLibrarystock.extract.Secondary = {};
  RnaiLibrarystock.extract.Custom = {};

  RnaiLibrarystock.on('attached', function(obj) {
    require('../extract/secondary/Rnai-Librarystock.js');
    require('../load/Rnai-Librarystock.js');
    require('../extract/Rnai-Librarystock.js');
    require('../helpers.js');
  });

};
