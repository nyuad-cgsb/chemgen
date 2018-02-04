'use strict';

const app = require('../../../../../server/server.js');
const ExperimentAssay = app.models.ExperimentAssay;

module.exports = function(ExperimentAssay) {
  ExperimentAssay.helpers = {};
  ExperimentAssay.load = {};
  ExperimentAssay.extract = {};
  ExperimentAssay.load.workflows = {};

  ExperimentAssay.on('attached', function(obj) {
    require('../helpers.js');
    require('../load/ExperimentAssay.js');
    require('../extract/ExperimentAssay.js');
  });
};
