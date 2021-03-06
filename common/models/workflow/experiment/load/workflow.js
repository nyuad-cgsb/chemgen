'use strict';

const app = require('../../../../../server/server');
const Promise = require('bluebird');
const Workflow = app.models.Workflow;
const fs = require('fs');
const readFile = Promise.promisify(require('fs')
  .readFile);
const jsonfile = require('jsonfile');

Workflow.experiment.getPlates = function(workflowData) {
  return new Promise(function(resolve, reject) {
    app.models.Plate.search(workflowData.search.instrument.arrayscan)
      .then(function(platesList) {
        return Workflow.experiment.mapPlates(workflowData, platesList);
      })
      .then(function() {
        resolve();
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        reject(new Error(error));
      });
  });
};

Workflow.experiment.mapPlates = function(workflowData, platesList) {
  app.winston.info('Starting screen ' + workflowData.screenName);
  app.winston.info('There are ' + platesList.length + ' plates');
  return new Promise(function(resolve, reject) {
    Promise.map(platesList, function(plate) {
      app.winston.info('Starting Plate: ' + plate.csPlateid + ' Name: ' + plate.name);
      return Workflow.experiment.processPlate(workflowData, plate);
    }, {concurrency: 6})
      .then(function(results) {
        resolve();
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        reject(new Error(error));
      });
  });
};

Workflow.experiment.processPlate = function(workflowData, plate) {
  return new Promise(function(resolve, reject) {
    app.models.ExperimentExperimentplate.load.workflows.processVendorPlates(workflowData, [plate])
      .then(function(plateInfoList) {
        // return app.models[workflowData.libraryStockModel].load.workflows
        return app.models[workflowData.libraryModel].load.workflows
        .processExperimentPlates(workflowData, plateInfoList);
      })
      .then(function(results) {
        return app.models.ExperimentAssay.load.workflows.processExperimentPlates(workflowData, results);
      })
      .then(function(results) {
        return app.models.WpPosts.load.plate.workflows.processPosts(workflowData, results);
      })
      .then(function(results) {
        return app.models.WpPosts.load.assay.workflows.processExperimentPlates(workflowData, results);
      })
      .then(function(results) {
        app.winston.info(JSON.stringify(results));
        app.winston.info('Finished Plate: ' + plate.csPlateid);
        resolve();
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        reject(new Error(error));
      });
  });
};
