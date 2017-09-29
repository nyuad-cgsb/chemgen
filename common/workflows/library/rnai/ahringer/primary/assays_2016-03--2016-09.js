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

// var mapWorkflowDataList = function(workflowDataList) {
//   return new Promise(function(resolve, reject) {
//     Promise.map(workflowDataList, function(workflowData) {
//         return app.models.Workflow.library.ahringer.getPlates(workflowData);
//       }, {concurrency: 1})
//       .then(function(results) {
//         resolve();
//       })
//       .catch(function(error) {
//         app.winston.error(error.stack);
//         reject(new Error(error));
//       });
//   });
// };
//
// app.models.Workflow.library.ahringer.primary.create(workflowDataFile)
//   .then(function(workflowDataList) {
//     // var workflowData = [workflowDataList[0]];
//     return mapWorkflowDataList(workflowDataList);
//   })
//   .then(function(platesList) {
//     return app.models.Workflow.library.ahringer.mapPlates(workflowData, platesList);
//   })
//   .catch(function(error) {
//     app.winston.error(error.stack);
//   });

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
