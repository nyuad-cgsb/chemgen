'use strict';

const app = require('../../../../../../server/server.js');
const Promise = require('bluebird');
const fs = require('fs');
const readFile = Promise.promisify(require('fs')
  .readFile);
const jsonfile = require('jsonfile');
const path = require('path');

const Workflow = app.models.Workflow;

// 1. Assign Screen Data - name, stage, wells, etc.
// 2. Read in data file corresponding to the screen - its a json file in ./data
// 3. Get Plates
// 4. Iterate over Plates
// 5. Process Plate
// 6. Process Well

/// ////////////////////////////////
// BEGIN DECEMBER SCREEN
/// ////////////////////////////////
var wellDataFile = path.resolve(__dirname, 'data', '2017-03-08--Secondary_Plate002_002.json');
var assayDate = '2017-03-08';
var screenName = 'AHR2-' + assayDate + '--02--Sec';
var like = 'rnai.2%';
var loopUpIndex = 1;
var commentIndex = 0;
var imageDates = [
  {
    creationdate: '2017-03-14',
  },
  {
    creationdate: '2017-03-13',
  },
];

var workflowData = {
  // tasks: ['task1', 'task2', 'task3'],
  library: 'ahringer',
  libraryModel: 'RnaiLibrary',
  libraryStockModel: 'RnaiLibrarystock',
  condition: 'Permissive',
  assayDate: assayDate,
  imageDates: imageDates,
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
  screenId: 0,
};

Workflow.experiment.secondary.create(workflowData, wellDataFile)
  .then(function(workflowData) {
    return Workflow.experiment.getPlates(workflowData);
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
