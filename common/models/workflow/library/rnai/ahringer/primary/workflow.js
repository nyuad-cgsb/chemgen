'use strict';

const app = require('../../../../../../../server/server');
const Promise = require('bluebird');
const Workflow = app.models.Workflow;
const fs = require('fs');
const readFile = Promise.promisify(require('fs')
  .readFile);

Workflow.library.ahringer.primary.create = function(workflowDataFile) {
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
