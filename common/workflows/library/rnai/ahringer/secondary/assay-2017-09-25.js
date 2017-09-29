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
var wellDataFile = path.resolve(__dirname, 'data', '2017-09-25-Secondary_Plate001_001.json');
var assayDate = '2017-09-20';
var screenName = 'AHR2-' + assayDate + '--Sec';
var like = 'rnai%';
var loopUpIndex = 1;
var commentIndex = 0;
var imageDates = [{
    creationdate: '2017-09-25',
  },
  {
    creationdate: '2017-09-26',
  },
];

var wells = [
  'A01', 'A02', 'A03', 'A04', 'A05', 'A06',
  'A07', 'A08', 'A09', 'A10', 'A11', 'A12',
  'B01', 'B02', 'B03', 'B04', 'B05', 'B06',
  'B07', 'B08', 'B09', 'B10', 'B11', 'B12',
  'C01', 'C02', 'C03', 'C04', 'C05', 'C06',
  'C07', 'C08', 'C09', 'C10', 'C11', 'C12',
  'D01', 'D02', 'D03', 'D04', 'D05', 'D06',
  'D07', 'D08', 'D09', 'D10', 'D11', 'D12',
  'E01', 'E02', 'E03', 'E04', 'E05', 'E06',
  'E07', 'E08', 'E09', 'E10', 'E11', 'E12',
  'F01', 'F02', 'F03', 'F04', 'F05', 'F06',
  'F07', 'F08', 'F09', 'F10', 'F11', 'F12',
  'G01', 'G02', 'G03', 'G04', 'G05', 'G06',
  'G07', 'G08', 'G09', 'G10', 'G12',
  'H01', 'H02', 'H03', 'H04', 'H05', 'H06',
  'H12',
];

var workflowData = {
  // tasks: ['task1', 'task2', 'task3'],
  library: 'ahringer',
  libraryModel: 'RnaiLibrary',
  libraryStockModel: 'RnaiLibrarystock',
  condition: 'Permissive',
  assayDate: assayDate,
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
    return;
  })
  .catch(function(error) {
    app.winston.error(error.stack);
  });
