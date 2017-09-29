'use strict';

const app = require('../../../../../../server/server');
const Promise = require('bluebird');
const Workflow = app.models.Workflow;
const fs = require('fs');
const readFile = Promise.promisify(require('fs')
  .readFile);
const jsonfile = require('jsonfile');

Workflow.experiment.secondary.create = function(workflowData, wellDataFile) {
  return new Promise(function(resolve, reject) {
    // This reads in the data supplied by Rawan about the wells
    readFile(wellDataFile, 'utf8')
      .then(function(contents) {
        workflowData.data.library = {};
        workflowData.data.library.wellData = JSON.parse(contents);
        return app.models.Workflow.create(workflowData);
      })
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        reject(new Error(error));
      });
  });
};
