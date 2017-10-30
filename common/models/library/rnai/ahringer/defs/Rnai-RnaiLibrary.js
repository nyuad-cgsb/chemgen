'use strict';

module.exports = function(RnaiRnailibrary) {

  const app = require('../../../../../../server/server');

  RnaiRnailibrary.Primary = {};
  RnaiRnailibrary.Secondary = {};
  RnaiRnailibrary.Custom = {};
  RnaiRnailibrary.workflows = {};
  RnaiRnailibrary.helpers = {};
  RnaiRnailibrary.helpers.buildControlTag = {};

  RnaiRnailibrary.load = {};
  RnaiRnailibrary.load.workflows = {};
  RnaiRnailibrary.load.Primary = {};
  RnaiRnailibrary.load.Secondary = {};
  RnaiRnailibrary.load.Custom = {};

  RnaiRnailibrary.extract = {};
  RnaiRnailibrary.extract.workflows = {};
  RnaiRnailibrary.extract.Primary = {};
  RnaiRnailibrary.extract.Secondary = {};
  RnaiRnailibrary.extract.Custom = {};

  RnaiRnailibrary.on('attached', function(obj) {
    require('../extract/secondary/Rnai-RnaiLibrary.js');
    require('../extract/primary/Rnai-RnaiLibrary.js');
    require('../load/Rnai-RnaiLibrary.js');
    require('../extract/Rnai-RnaiLibrary.js');
    require('../helpers/Rnai-RnaiLibrary');
  });
};
