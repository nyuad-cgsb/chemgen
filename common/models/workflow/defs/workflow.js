'use strict';

module.exports = function(Workflow) {

  Workflow.library = {};
  Workflow.library.ahringer = {};
  Workflow.library.ahringer.primary = {};
  Workflow.library.ahringer.secondary = {};

  Workflow.experiment = {};
  Workflow.experiment.primary = {};
  Workflow.experiment.secondary = {};

  Workflow.on('attached', function(obj) {
    require('../library/rnai/ahringer/workflow');
    require('../library/rnai/ahringer/secondary/workflow');
    require('../library/rnai/ahringer/primary/workflow');
    require('../experiment/load/primary/workflow');
    require('../experiment/load/secondary/workflow');
    require('../experiment/load/workflow');
  });
};
