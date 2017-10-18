'use strict';

const app = require('../../../../../../server/server.js');
const Promise = require('bluebird');
const jsonfile = require('jsonfile');
const path = require('path');
const fs = require('fs');
const readFile = Promise.promisify(require('fs')
  .readFile);

const _ = require('lodash');
const Workflow = app.models.Workflow;
const Plate = app.models.Plate;

var screenName = 'AHR-2016-06-23--Pr';
var workflowDataFile = path.resolve(__dirname,
  'data',
  'primary_assays-2016-06.json');

// TODO Update the screenId - we should create a screenId instead of just relying on the name
// var workflowDataFile = path.resolve(__dirname,
//   'data',
//   'primary_assays-2016-03--2016-09.json');

    // return Workflow.experiment.getPlates(workflowData);

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
    app.winston.error(error.stack);
    process.exit(1);
  });
