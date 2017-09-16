'use strict';

module.exports = function(ExperimentExperimentplate) {
  const Promise = require('bluebird');
  const app = require('../../../../../server/server');

  ExperimentExperimentplate.helpers = {};
  ExperimentExperimentplate.load = {};
  ExperimentExperimentplate.load.workflows = {};

  ExperimentExperimentplate.on('attached', function(obj) {
    require('../load/Experiment-ExperimentPlate');
  });
};
