'use strict';

module.exports = function(ExperimentManualscores) {
  ExperimentManualscores.extract = {};
  ExperimentManualscores.extract.workflows = {};

  ExperimentManualscores.load = {};
  ExperimentManualscores.load.workflows = {};

  ExperimentManualscores.transform = {};
  ExperimentManualscores.transform.workflows = {};

  ExperimentManualscores.on('attached', function(obj) {
    require('../load/Experiment-ManualScores');
    require('../extract/Experiment-ManualScores');
    require('../transform/Experiment-ManualScores');
  });
};
