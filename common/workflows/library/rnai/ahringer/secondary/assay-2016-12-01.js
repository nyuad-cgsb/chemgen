'use strict';

const app = require('../../../../../../server/server.js');
const Promise = require('bluebird');
const fs = require('fs');
const readFile = Promise.promisify(require('fs')
  .readFile);
const jsonfile = require('jsonfile');
const path = require('path');

// var workflow = require('./lib/workflow');

// 1. Assign Screen Data - name, stage, wells, etc.
// 2. Read in data file corresponding to the screen - its a json file in ./data
// 3. Get Plates
// 4. Iterate over Plates
// 5. Process Plate
// 6. Process Well

/// ////////////////////////////////
// BEGIN DECEMBER SCREEN
/// ////////////////////////////////
var file = path.resolve(__dirname) + '/data/assay_2016-12-11.json';
var assayDate = '2016-12-11';
var screenName = 'AHR2-2016-12-11--PR';
var like = 'rnai%';
var loopUpIndex = 0;
var commentIndex = 1;
var imageDates = [{
    creationdate: '2017-01-16',
  },
  {
    creationdate: '2017-01-17',
  },
];

var wells = [
  'A01', 'A02', 'A03', 'A04', 'A05', 'A06',
  'A07', 'A08', 'A09', 'A10', 'A11', 'A12',
  'B01', 'B02', 'B03', 'B04', 'B05', 'B06',
  'B07', 'B08', 'B09', 'B12',
  'C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07',
  'C08', 'C09', 'C10', 'C11', 'C12',
  'D01', 'D02', 'D03', 'D04', 'D05', 'D12',
  'E01', 'E02', 'E03', 'E04', 'E05', 'E06',
  'E07', 'E12',
  'F01', 'F02', 'F03', 'F04', 'F05', 'F12',
  'G01', 'G02', 'G03', 'G12',
  'H01', 'H12',
];

// The condition needs to be set throughout the workflow
// The arrayscan search denotes the search function we use to get plates
var workflowData = {
  tasks: ['task1', 'task2', 'task3'],
  library: 'ahringer',
  libraryModel: 'RnaiLibrary',
  libraryStockModel: 'RnaiLibrarystock',
  condition: 'Permissive',
  assayDate: '2017-12-11',
  imageDates: imageDates,
  wells: wells,
  screenStage: 'Secondary',
  permissiveTemp: 30,
  restrictiveTemp: 30,
  screenName: screenName,
  instrumentId: 1,
  isJunk: 0,
  search: {
    instrument: {
      arrayscan: {
        and: [{
          or: [{
            name: {
              like: '%' + like,
            },
          }, {
            name: {
              like: 'L4440%',
            },
          }],
        }, {
          or: imageDates,
        }],
      },
    },
    library: {
      rnai: {
        ahringer: {
          lookUpIndex: loopUpIndex,
          commentIndex: commentIndex,
        },
      },
    },
  },
  data: {},
  screenId: 1,
};

var addWorkflowData = function(file) {
  return new Promise(function(resolve, reject) {
    // This reads in the data supplied by Rawan about the wells
    readFile(file, 'utf8')
      .then(function(contents) {
        workflowData.data.library = {};
        workflowData.data.library.wellData = JSON.parse(contents);
        return app.models.Workflow.create(workflowData);
      })
      .then(function(results){
        resolve(results);
      })
      .catch(function(error) {
        reject(new Error(error));
      });
  });
};

//TODO Break this up - make sure we are working from the actual model
//We should also only process one plate at a time - otherwise we will fill up
//the memory

addWorkflowData(file)
  .then(function(workflowData) {
    return app.models.Plate.search(workflowData.search.instrument.arrayscan);
  })
  .then(function(platesList) {
    //TODO break here
    var plate = [platesList[0]];
    return app.models.ExperimentExperimentplate.load.workflows.processVendorPlates(workflowData, plate);
  })
  .then(function(plateInfoList) {
    return app.models.RnaiLibrarystock.load.workflows.processExperimentPlates(workflowData, plateInfoList);
  })
  .then(function(results) {
    //This completes the usual database operations - now onto the wordpress portion
    return app.models.ExperimentAssay.load.workflows.processExperimentPlates(workflowData, results);
  })
  .then(function(results){
    app.winston.info('results are ' + JSON.stringify(results));
  })
  .catch(function(error) {
    app.winston.error(error.stack);
  });
