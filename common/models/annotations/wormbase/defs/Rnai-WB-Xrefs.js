'use strict';

module.exports = function(RnaiWbXrefs) {
  RnaiWbXrefs.load = {};
  RnaiWbXrefs.load.workflows = {};

  RnaiWbXrefs.extract = {};
  RnaiWbXrefs.extract.workflows = {};

  RnaiWbXrefs.on('attached', function(obj) {
    require('../load/Rnai-WB-Xrefs');
    require('../extract/Rnai-WB-Xrefs');
  });

};
