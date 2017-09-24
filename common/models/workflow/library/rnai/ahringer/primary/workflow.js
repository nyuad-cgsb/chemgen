'use strict';

const app = require('../../../../../../../server/server');
const Promise = require('bluebird');
const Workflow = app.models.Workflow;
const fs = require('fs');
const readFile = Promise.promisify(require('fs')
  .readFile);

Workflow.library.ahringer.secondary.create = function(workflowDataFile) {
  return new Promise(function(resolve, reject) {
    // This reads in the data supplied by Rawan about the wells
    readFile(workflowDataFile, 'utf8')
      .then(function(contents) {
        workflowDataList = JSON.parse(contents);
        return app.models.Workflow.createMany(workflowDataList);
      })
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        reject(new Error(error));
      });
  });
};
