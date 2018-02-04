'use strict';

module.exports = function(ExperimentTensorflowcounts) {
  ExperimentTensorflowcounts.extract = {};
  ExperimentTensorflowcounts.extract.workflows = {};

  ExperimentTensorflowcounts.load = {};
  ExperimentTensorflowcounts.load.workflows = {};

  ExperimentTensorflowcounts.transform = {};
  ExperimentTensorflowcounts.transform.workflows = {};

  ExperimentTensorflowcounts.on('attached', function(obj) {
    require('../extract/Experiment-TensorflowCounts');
    // require('../load/Experiment-ManualScores');
    // require('../transform/Experiment-ManualScores');
  });
};
