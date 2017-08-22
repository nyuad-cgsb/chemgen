'use strict';

const app = require('../../../../../server/server');
const Promise = require('bluebird');
const fs = require('fs');
const readFile = Promise.promisify(require('fs')
  .readFile);
const jsonfile = require('jsonfile');
const path = require('path');

const expect = require('chai')
  .expect;
const assert = require('assert');
const util = require('util');
const diff = require('deep-diff')
  .diff;

var workflowData = require('../../../../data/library/rnai/secondary/workflow.json');
var rnaiLibraryData = require('../../../../data/library/rnai/secondary/rnailibrary.json');

describe('001_secondarySpec.test.js Library.rnai.ahringer Secondary Parsing', function() {
  it('Should tell us our primary exists', function() {
    expect(app.models.RnaiLibrarystock.Primary).to.deep.equal({});
  });

  it('Should parse data from the custom ahringer plate', function(done) {
    app.etlWorkflow.helpers.rows = ['A'];
    app.models.RnaiLibrarystock.extract.Secondary
      .parseCustomPlate(workflowData)
      .then(function(results) {
        var firstResult = {
          'splitLookUp': ['L4440'],
          'row': 'A',
          'origKey': '1',
          'assayWell': 'A01',
        };
        var middleResult = {
          'splitLookUp': ['I-4-D12', 'rba-1'],
          'row': 'A',
          'origKey': '6',
          'assayWell': 'A06',
        };
        var lastResult = {
          'splitLookUp': ['L4440'],
          'row': 'A',
          'origKey': '12',
          'assayWell': 'A12',
        };
        expect(results[0]).to.deep.equal(firstResult);
        expect(results[5]).to.deep.equal(middleResult);
        expect(results.slice(-1)[0]).to.deep.equal(lastResult);
        done();
      })
      .catch(function(error) {
        done(new Error(error));
      });
  });

  describe('RnaiLibrary Secondary Screens', function() {
    // TODO Set up sandbox of parentLibrary well info
    before(function(done) {
      app.models.RnaiRnailibrary.create(rnaiLibraryData)
        .then(function(results) {
          done();
        })
        .catch(function(error) {
          done(new Error(error));
        });
    });

    it('Should return the entire getParentLibrary Workflow', function(done) {
      app.etlWorkflow.helpers.rows = ['A', 'C'];
      app.models.RnaiLibrarystock.extract.Secondary.getParentLibrary(workflowData)
        .then(function(results) {
          // Loopback adds extra metadata to an object that we don't need to test for
          results = JSON.stringify(results);
          results = JSON.parse(results);
          expect(results.length).to.equal(24);
          expect(results[0]).to.deep.equal({
            'wellData': {
              'splitLookUp': ['L4440'],
              'row': 'A',
              'origKey': '1',
              'assayWell': 'A01',
            },
            'geneName': 'L4440',
            'well': 'A01',
          });
          expect(results[1]).to.deep.equal({
            'rnailibraryId': 73,
            'plate': 1,
            'well': 'A02',
            'chrom': 'I',
            'geneName': 'K12C11.2',
            'fwdPrimer': 'GAGAAACCGAGTATCTCAGTGGA',
            'revPrimer': 'GCGATGCGTTTAATTAAGTTTTG',
            'bioloc': 'I-1O13',
            'stocktitle': 'I-1--A1',
            'stockloc': 'A1-H07',
            'wellData': {
              'splitLookUp': ['I-1-O13', 'Smo-1'],
              'row': 'A',
              'origKey': '2',
              'assayWell': 'A02'
            },
            'origWell': 'A02',
            'comment': 'Smo-1'
          });
          done();
        })
        .catch(function(error) {
          done(new Error(error));
        });
    });
  });
});
