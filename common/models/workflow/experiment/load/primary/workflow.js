'use strict';

const app = require('../../../../../../server/server');
const Promise = require('bluebird');
const Workflow = app.models.Workflow;
const fs = require('fs');
const readFile = Promise.promisify(require('fs')
  .readFile);
const jsonfile = require('jsonfile');

Workflow.experiment.primary.create = function(workflowDataFile) {
  return new Promise(function(resolve, reject) {
    // This reads in the data supplied by Rawan about the wells
    readFile(workflowDataFile, 'utf8')
      .then(function(contents) {
        var workflowDataList = JSON.parse(contents);
        Promise.map(workflowDataList, function(workflowData) {
          workflowData.condition = 'fillThisIn';
          workflowData.tasks = ['getRidOfThis'];
          return app.models.Workflow.create(workflowData);
        })
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        reject(new Error(error));
      });
      });
  });
};

Workflow.experiment.primary.mapWorkflows = function(workflowDataList) {
  return new Promise(function(resolve, reject) {
    Promise.map(workflowDataList, function(workflowData) {
        return Workflow.experiment.getPlates(workflowData);
      }, {concurrency: 4})
      .then(function(results) {
        resolve();
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        reject(new Error(error));
      });
  });
};
