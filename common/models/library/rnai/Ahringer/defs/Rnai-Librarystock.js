'use strict';

module.exports = function(RnaiLibrarystock) {
  const Promise = require('bluebird');
  const app = require('../../../../../../server/server');
  var _ = require('lodash');
  var slug = require('slug');

  RnaiLibrarystock.Primary = {};
  RnaiLibrarystock.Secondary = {};
  RnaiLibrarystock.Custom = {};

  RnaiLibrarystock.load = {};
  RnaiLibrarystock.load.Primary = {};
  RnaiLibrarystock.load.Secondary = {};
  RnaiLibrarystock.load.Custom = {};

  RnaiLibrarystock.extract = {};
  RnaiLibrarystock.extract.Primary = {};
  RnaiLibrarystock.extract.Secondary = {};
  RnaiLibrarystock.extract.Custom = {};

  RnaiLibrarystock.on('attached', function(obj) {
    require('../extract/secondary/Rnai-Librarystock.js');
  });
};
