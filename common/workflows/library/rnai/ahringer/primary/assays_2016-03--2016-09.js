'use strict';

const app = require('../../../../../../server/server.js');
const Promise = require('bluebird');
const jsonfile = require('jsonfile');
const path = require('path');

const Workflow = app.models.Workflow;

// TODO Update the screenId - we should create a screenId instead of just relying on the name
var workflowDataFile = path.resolve(__dirname,
  'data',
  'primary_assays-2016-03--2016-09.json');

Workflow.experiment.primary.create(workflowDataFile)
  .then(function(workflowDataList) {
    return Workflow.experiment.primary.mapWorkflows(workflowDataList);
  })
  .then(function() {
    app.winston.info('Finished entire workflow!');
    process.exit(0);
    return;
  })
  .catch(function(error) {
    app.winston.info('Finished entire workflow! ERRORS!!');
    process.exit(1);
    app.winston.error(error.stack);
  });
