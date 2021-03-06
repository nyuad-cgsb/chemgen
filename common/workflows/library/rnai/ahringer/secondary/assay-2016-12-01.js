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
var wellDataFile = path.resolve(__dirname, 'data', 'assay_2016-12-11.json');
var assayDate = '2016-12-11';
var screenName = 'AHR2-2016-12-11--Sec';
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
  // tasks: ['task1', 'task2', 'task3'],
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
