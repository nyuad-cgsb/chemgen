'use strict';

const app = require('../../../../../../server/server');
const Promise = require('bluebird');
const path = require('path');

const Workflow = app.models.Workflow;

var workflowDataFile = path.resolve(__dirname,
  'data',
  'chembridge_primary.json');

Workflow.experiment.primary.create(workflowDataFile)
  .then(function(workflowDataList) {
    return Workflow.experiment.primary.mapWorkflows(workflowDataList);
  })
  .then(function() {
    return;
  })
  .catch(function(error) {
    app.winston.error(error.stack);
  });
