'use strict';

module.exports = function(ChemicalChembridgexrefs) {
  ChemicalChembridgexrefs.load = {};
  ChemicalChembridgexrefs.load.workflows = {};

  ChemicalChembridgexrefs.extract = {};
  ChemicalChembridgexrefs.extract.workflows = {};

  ChemicalChembridgexrefs.on('attached', function(obj) {
    require('../load/Chemical-ChembridgeXrefs');
    require('../extract/Chemical-ChembridgeXrefs');
  });
};
