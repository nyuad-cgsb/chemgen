'use strict';

/**
Screens get passed to me in an excel sheel
I download these as a CSV, and parse out the data
**/

const Promise = require('bluebird');
const fs = require('fs');
//TODO Update this for papaparse
const csv = require('fast-csv');
const slug = require('slug');
const path = require('path');
const jsonfile = require('jsonfile');

var workflowDataList = [];

var chrom = '';
var screenName = '';
var creationDates = [];
var assayDate = '';

var file = path.resolve(__dirname, 'RNAi_mel-28.tsv');

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
  var stream = fs.createReadStream(file);

  var csvStream = csv
    .fromStream(stream, {
      headers: true,
      delimiter: '\t',
    })
    .on('data', function(data) {
      decideData(data)
        .then(function() {})
        .catch(function(error) {
          console.log('we got an error! ' + error);
        });
    })
    .on('end', function() {
      console.log('csv stream done');
    })
    .on('close', function() {
      console.log('csv stream end');
    });

  stream.pipe(csvStream);
  stream.on('close', function() {
    console.log('stream done');
  // process.exit(0);
  });
  stream.on('end', function() {
    console.log('stream end');

    // console.log(JSON.stringify(workflowDataList));
    jsonfile.writeFileSync(path.resolve(__dirname, 'primary_assays-2016-03--2016-09.json'), workflowDataList, {spaces: 2})
  // process.exit(0);
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
  var tscreen = 'AHR-';
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
};

var decideData = function(data) {
  data.imageDates = creationDates;

  if (data['Assay date']) {
    assayDate = parseDates(data['Assay date']);
  }
  if (data['Chromosome no.']) {
    chrom = data['Chromosome no.'];
  }
  if (data['Library Screen type']) {
    //Create a new screen
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
        // console.log(JSON.stringify(data, null, 2));
        var barcode = 'RNAi' + chrom + '.' + data['RNAi plate no.'];
        data.barcode = barcode;

        var FormData = {
          screenName: screenName,
          library: 'ahringer',
          libraryModel: 'RnaiLibrary',
          libraryStockModel: 'RnaiLibrarystock',
          isJunk: 0,
          assayDate: assayDate,
          imageDates: data.imageDates,
          screenStage: 'Primary',
          permissiveTemp: data['Enhancer temp'],
          restrictiveTemp: data['Suppressor temp'],
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
