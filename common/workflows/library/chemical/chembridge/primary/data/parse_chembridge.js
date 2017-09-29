'use strict';

/**
Screens get passed to me in an excel sheel
I download these as a CSV, and parse out the data
**/

const app = require('../../../../../../../server/server');
const Promise = require('bluebird');
const fs = require('fs');
const slug = require('slug');
const path = require('path');
const jsonfile = require('jsonfile');
const Papa = require('papaparse');

var workflowDataList = [];

var screenName = '';
var creationDates = [];
var assayDate = '';

var file = path.resolve(__dirname, 'chembridge_cleaned.tsv');

var parseDates = function(date) {
  var assayDates = date.split('/');
  var day = assayDates[0];
  day = ('00' + day).slice(-2);
  var month = assayDates[1];
  month = ('00' + month).slice(-2);
  var year = assayDates[2];
  if (!year) {
    return;
  }
  var newDate = year + '-' + month + '-' + day;
  return newDate;
};

var createScreen = function(data) {
  var tscreen = 'CHEMB-';
  screenName = '';

  if (assayDate) {
    var assayDates = data['assayDate'].split('/');
    var day = assayDates[0];
    day = ('00' + day).slice(-2);
    var month = assayDates[1];
    month = ('00' + month).slice(-2);
    var year = assayDates[2];
    if (!year) {
      return;
    }

    tscreen = tscreen + slug(year + '-' + month + '-' + day);
  }
  tscreen = tscreen + '--Pr';
  screenName = tscreen;
};

var parseCreationDates = function(dateStr) {
  var dates = dateStr.split(',');
  dates.map(function(date, index) {
    var dateObj = {
      creationdate: date,
    };
    dates[index] = dateObj;
  });
  return dates;
};

var inputStream = fs.createReadStream(file, 'utf8');
Papa.parse(inputStream, {
  header: true,
  delimiter: '\t',
  comments: '#',
  fastMode: false,
  worker: false,
  // preview: 100,
  step: function(results) {
    inputStream.pause();
    genWorkflowData(results.data[0]);
    inputStream.resume();
  },
  complete: function() {
    console.log('All done!');
    jsonfile.writeFileSync(path.resolve(__dirname, 'chembridge_primary.json'),
      workflowDataList, {
        spaces: 2,
      });
  },
});

function genWorkflowData(data) {
  var assayDate = parseDates(data['assayDate']);
  var creationDates = parseCreationDates(data['ArrayScan Imaging date']);
  var screenName = 'CHEMB-' + assayDate + '--Prim';

  var workflowData = {
    screenName: screenName,
    library: 'chembridge',
    libraryModel: 'ChemicalChembridgeLibrary',
    libraryStockModel: 'ChemicalLibrarystock',
    isJunk: 0,
    assayDate: assayDate,
    imageDates: creationDates,
    screenStage: 'Primary',
    permissiveTemp: 30,
    restrictiveTemp: 30,
    instrumentId: 1,
    screenId: 1,
    search: {
      instrument: {
        arrayscan: {
          and: [{
            or: [{
              name: {
                like: 'M%',
              },
            }, {
              name: {
                like: 'L4440%',
              },
            }],
          }, {
            or: creationDates,
          }],
        },
      },
      library: {
        chemical: {
          chembridge: {},
        },
      },
    },
    data: {
      comments: data['Comments'],
      wormStrain: data['Worm Strain'],
      chemicalPlate: data['Chemical plate ID'],
      chemicalConcentration: data['Chemical conc'],
      dmso: data['% DMSO'],
      incubationTime: data['Incubation time'],
      incubationTemp: data['Incubation temperature (°C)'],
      arrayScanDate: data['ArrayScan Imaging date'],
      odReadingDate: parseDates(data['OD 600 reading date']),
    },
  };
  workflowDataList.push(workflowData);
};
