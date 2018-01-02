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
  'one-assay.json');
var workflowData = require(workflowDataFile);

var testWorkflowData = require('./data/test-rnai-workflow.json');
var testResultsData = require('./data/test-rnai-results.json');

// Workflow.experiment.primary.create(workflowDataFile)
//   .then(function(workflowDataList) {
//     return Workflow.experiment.primary.mapWorkflows(workflowDataList);
//   })
//   .then(function(results) {
//     app.winston.info('Finished entire workflow!');
//     // app.winston.info(JSON.stringify(results));
//     // TODO Have to map the workflowData and the results
//     // Only for the primary_assays
//     // Secondary you dont
//     jsonfile.writeFileSync('test-rnai-workflow.json', workflowData[0], {spaces: 2});
//     jsonfile.writeFileSync('test-rnai-results.json', results[0], {spaces: 2});
    // return app.models.ExperimentManualscores.transform.workflows
    // .score(workflowData[0], results[0]);
  // })
app.models.ExperimentManualscores.transform.workflows
  .score(testWorkflowData, testResultsData)
  .then(function(results) {
    app.winston.info('Finished scoring workflow!');
    // app.winston.info(results[0]);
    process.exit(0);
    return;
  })
  .catch(function(error) {
    app.winston.info('Finished entire workflow! ERRORS!!');
    app.winston.error(error.stack);
    process.exit(1);
  });
