'use strict';

/**
Screens get passed to me in an excel sheel
I download these as a CSV, and parse out the data
**/

const app = require('../../../../../../../server/server');
const Promise = require('bluebird');
const slug = require('slug');
const path = require('path');
const jsonfile = require('jsonfile');
const fs = require('fs');
const Papa = require('papaparse');

var workflowDataList = [];

var chrom = '';
var screenName = '';
var creationDates = [];
var assayDate = '';
var screenNames = {};

var file = path.resolve(__dirname, '2018-01-30-RNAi_mip-1_mip-2.tsv');

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

var startStream = function(file) {
  console.log('starting stream!');
  var inputStream = fs.createReadStream(file, 'utf8');

  Papa.parse(inputStream, {
    header: true,
    comments: '//',
    delimiter: '\t',
    fastMode: false,
    worker: true,
    step: function(results) {
      inputStream.pause();
      console.log(JSON.stringify(results));
      decideData(results.data[0])
    .then(function(results) {
      return inputStream.resume();
    })
    .catch(function(error) {
      app.winston.error(error.stack);
      return inputStream.resume();
    });
      inputStream.resume();
    },
    complete: function() {
      app.winston.info('all done!');
      app.winston.info('Number of screens ' + Object.keys(screenNames).length);
      app.winston.info(JSON.stringify(screenNames, null, 2));
      jsonfile.writeFileSync(path.resolve(__dirname, 'primary_assays-2017-12.json'), workflowDataList, {
        spaces: 2,
      });
    },
  });
};

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
  var newDate = slug(year + '-' + month + '-' + day);
  return newDate;
};

var createScreen = function(data) {
  var tscreen = 'AHR2-';
  screenName = '';

  if (assayDate) {
    var assayDates = data['Assay date'].split('/');
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
  screenNames[screenName] = 0;
};

var decideData = function(data) {
  data.imageDates = creationDates;
  data.assayDate = assayDate;

  if (data['Assay date']) {
    assayDate = parseDates(data['Assay date']);
    data.assayDate = assayDate;
  }
  if (data['Chromosome no.']) {
    chrom = data['Chromosome no.'];
  }
  if (data['Library Screen type']) {
    // Create a new screen
  }
  if (data['CreationDate'] && data['CreationDate'] !== 'CreationDate') {
    creationDates = parseCreationDates(data['CreationDate']);
    data.imageDates = creationDates;
  }
  if (data['Library'] && data['Library'] !== 'Library') {
    createScreen(data);
  }

  return new Promise(function(resolve, reject) {
    if (data['RNAi plate no.']) {
      if (data['RNAi plate no.'] === 'RNAi plate no.') {
        resolve();
      } else {
        var count = screenNames[screenName];
        count = count + 1;
        screenNames[screenName] = count;

        // console.log(JSON.stringify(data, null, 2));
        var barcode = 'RNA%' + chrom + '.' + data['RNAi plate no.'];
        data.barcode = barcode;

        var FormData = {
          screenName: screenName,
          library: 'ahringer',
          libraryModel: 'RnaiLibrary',
          libraryStockModel: 'RnaiLibrarystock',
          isJunk: 0,
          assayDate: data.assayDate,
          imageDates: data.imageDates,
          screenStage: 'Primary',
          permissiveTemp: data['Enhancer temp'] || 17.5,
          restrictiveTemp: data['Suppressor temp'] || 23.3,
          instrumentId: 1,
          screenId: 1,
          search: {
            instrument: {
              arrayscan: {
                and: [{
                  or: [{
                    name: {
                      like: '%' + data.barcode + '%',
                    },
                  }, {
                    name: {
                      like: 'L4440%',
                    },
                  }],
                }, {
                  or: data.imageDates,
                }],
              },
            },
            library: {
              rnai: {
                ahringer: {
                  chrom: chrom,
                  RnaiPlateNo: data['RNAi plate no.'],
                },
              },
            },
          },
          data: {
            StampDate: parseDates(data['RNAi Stamp date']),
            CultureDate: parseDates(data['Culture date']),
            FreezeDate: parseDates(data['Freeze date']),
            IPTGInductionDate: parseDates(data['IPTG induction date']),
            restrictiveImageDate: parseDates(data['Suppressor Imaging and OD date']),
            permissiveImageDate: parseDates(data['Enhancer Imaging and OD date']),
            comments: data['Comments'],
          },
        };
        workflowDataList.push(FormData);

        resolve();
      }
    }
  });
};

startStream(file);
