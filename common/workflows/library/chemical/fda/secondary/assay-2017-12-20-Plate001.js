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
var wellDataFile = path.resolve(__dirname, 'data', '2017-12-14--FDA--Secondary_Plate001.json');
var assayDate = '2017-12-14';
// var screenName = 'FDA-' + assayDate + '--01--Sec';

// var screenName = 'FDA-2017-12-14--01--T-18.5-Sec';
// var like = '%FDA%18.5%';

// var screenName = 'FDA-2017-12-14--01--T-25-Sec';
// var like = '%FDA%25%';

var screenName = 'FDA-2017-12-14--01--T-20-Sec';
var like = '%FDA%20%';

var loopUpIndex = 0;
var commentIndex = 0;
var imageDates = [{
  creationdate: '2017-12-19',
},
{
  creationdate: '2017-12-20',
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
  'H01', 'H12',
];

var workflowData = {
  library: 'fda',
  wells: wells,
  libraryModel: 'ChemicalFdalibrary',
  libraryStockModel: 'ChemicalLibrarystock',
  condition: 'None',
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
              like: like,
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
    return doThings(workflowData);
  })
  .then(function(results) {
    app.winston.info('Finished entire workflow!');
    process.exit(0);
    return;
  })
  .catch(function(error) {
    app.winston.info('Finished entire workflow! ERRORS!!');
    app.winston.error(error.stack);
    process.exit(1);
  });

// function doThings(workflowData) {
//   return new Promise(function(resolve, reject) {
//     Workflow.experiment.getPlates(workflowData)
//       .then(function(results) {
//         return app.models.ExperimentManualscores.transform.workflows
//         .score(workflowData, results);
//       })
//       .then(function(results) {
//         app.winston.info('Finished scoring workflow!');
//         resolve(results);
//       })
//       .catch(function(error) {
//         app.winston.error(error.stack);
//         process.exit(1);
//       });
//   });
// };
function doThings(workflowData) {
  return new Promise(function(resolve, reject) {
    var results = jsonfile.readFileSync('FDA_2017-12-20-results.json');
    // Workflow.experiment.getPlates(workflowData)
    //   .then(function(results) {
    //     jsonfile.writeFileSync('FDA_2017-12-20-results.json', results, {spaces: 2});
    app.models.ExperimentManualscores.transform.workflows
      .score(workflowData, results)
      .then(function(results) {
        app.winston.info('Finished scoring workflow!');
        resolve(results);
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        process.exit(1);
      });
  });
};
