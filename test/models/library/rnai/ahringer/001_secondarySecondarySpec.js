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
const nock = require('nock');

var workflowData = require('../../../../data/library/rnai/secondary/workflow.json');
var rnaiLibraryData = require('../../../../data/library/rnai/secondary/rnailibrary.json');
var plateData = require('../../../../data/library/rnai/secondary/2017-12-11_assay.json');

//TODO Get this working
// var imageServer = nock('http://10.230.9.204:3001')
//   .post('/')
//   .reply(200);

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
    before(function(done) {
      app.models.Plate.create(plateData)
        .then(function(results) {
          return app.models.RnaiRnailibrary.create(rnaiLibraryData);
        })
        .then(function(results) {
          done();
        })
        .catch(function(error) {
          done(new Error(error));
        });
    });

    it('Should return the correct vendorPlate', function(done) {
      app.models.Plate.search(workflowData.search.instrument.arrayscan)
        .then(function(results) {
          // Loopback adds extra metadata to an object that we don't need to test for
          results = JSON.stringify(results);
          results = JSON.parse(results);
          expect(results[0]['csPlateid']).to.equal(plateData[0]['csPlateid']);
          expect(results[1]).to.deep.equal(plateData[1]);
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

    it('Should ensure we created the ExperimentPlate', function(done) {
      app.models.Plate.search(workflowData.search.instrument.arrayscan)
        .then(function(platesList) {
          var plate = [platesList[0]];
          return app.models.ExperimentExperimentplate.load.workflows.processVendorPlates(workflowData, plate);
        })
        .then(function(results) {
          results = JSON.stringify(results);
          results = JSON.parse(results);
          expect(results[0]['ExperimentExperimentplate']).to.deep.equal({
            "barcode": "RNAi.1.N2.S",
            "experimentPlateId": 1,
            "imagePath": "\\\\aduae120-wap\\CS_DATA_SHARE\\2017Jan16\\MFGTMP_170116160001\\",
            "plateStartTime": "2017-01-16T16:03:54.000Z",
            "instrumentId": 1,
            "instrumentPlateId": 7699,
            "screenId": 1,
            "screenStage": "Secondary"
          });
          expect(results[0]['vendorPlate']['csPlateid']).to.equal(7699);
          done();
        })
        .catch(function(error) {
          done(new Error(error));
        });
    });

    it('Should ensure we created the RnaiLibrarystock', function(done) {
      app.models.Plate.search(workflowData.search.instrument.arrayscan)
        .then(function(platesList) {
          var plate = [platesList[0], platesList[5], platesList[platesList.length - 1]];
          return app.models.ExperimentExperimentplate.load.workflows.processVendorPlates(workflowData, plate);
        })
        .then(function(plateInfoList) {
          return app.models.RnaiLibrarystock.load.workflows.processExperimentPlates(workflowData, plateInfoList);
        })
        .then(function(results) {
          results = JSON.stringify(results);
          results = JSON.parse(results);
          expect(Object.keys(results[0])).to.deep.equal(["plateInfo", "libraryDataList"]);
          expect(results.length).to.equal(3);
          expect(results[0]['libraryDataList'][8]['libraryStock']).to.deep.equal({
            "librarystockId": 9,
            "parentstockId": 1323,
            "librarystockName": "RNAi.1.N2.S",
            "plateId": 2,
            "well": "A09",
            "metaLibrarystock": "{\"library\":\"ahringer\"}",
            "taxTerms": [{
                "taxonomy": "image_date",
                "taxTerm": "2017-01-16T16:03:54.000Z"
              },
              {
                "taxonomy": "wb_sequence_id",
                "taxTerm": "F30A10.10"
              },
              {
                "taxonomy": "condition",
                "taxTerm": "Restrictive"
              },
              {
                "taxonomy": "envira-tag",
                "taxTerm": "2016-12-11--PR_Restrictive_N2_F30A10.10"
              },
              {
                "taxonomy": "envira-tag",
                "taxTerm": "2016-12-11--PR_RNAi.1.N2.S"
              },
              {
                "taxonomy": "envira-tag",
                "taxTerm": "2016-12-11--PR_RNAi.1.N2.S_Restrictive_N2_F30A10.10"
              },
              {
                "taxonomy": "envira-tag",
                "taxTerm": "2016-12-11--PR_Restrictive_N2_A09"
              }
            ],
            "taxTerm": "F30A10.10",
            "geneName": "F30A10.10"
          });
          done();
        })
        .catch(function(error) {
          done(new Error(error));
        });
    });

    it('Should run processExperimentPlates', function(done) {
      app.models.Plate.search(workflowData.search.instrument.arrayscan)
        .then(function(platesList) {
          var plate = [platesList[0], platesList[5], platesList[platesList.length - 1]];
          return app.models.ExperimentExperimentplate.load.workflows.processVendorPlates(workflowData, plate);
        })
        .then(function(plateInfoList) {
          return app.models.RnaiLibrarystock.load.workflows.processExperimentPlates(workflowData, plateInfoList);
        })
        .then(function(results) {
          return app.models.ExperimentAssay.load.workflows.processExperimentPlates(workflowData, results);
        })
        .then(function(results) {
          results = JSON.stringify(results);
          results = JSON.parse(results);

          expect(results.length).to.equal(3);
          expect(Object.keys(results[0])).to.deep.equal(["plateInfo", "experimentAssayList"]);

          expect(results[0]['experimentAssayList'][0]['experimentAssayData']).to.deep.equal({
            "assayId": 1,
            "platePath": "assays/2017Jan16/7699/RNAi.1.N2.S_A01-autolevel.jpeg",
            "assayName": "RNAi.1.N2.S_A01",
            "plateId": 5,
            "well": "A01",
            "biosampleId": 1,
            "reagentId": 181,
            "isJunk": 0,
            "assayType": "ahringer",
            "metaAssay": "{\"experimentType\":\"organism\",\"library\":\"ahringer\"}"
          });

          expect(results[0]['experimentAssayList'][0]['libraryData']).to.deep.equal({
            "libraryStock": {
              "librarystockId": 181,
              "librarystockName": "RNAi.1.N2.S",
              "plateId": 5,
              "well": "A01",
              "metaLibrarystock": "{\"library\":\"ahringer\"}",
              "taxTerms": [{
                "taxonomy": "image_date",
                "taxTerm": "2017-01-16T16:03:54.000Z"
              }, {
                "taxonomy": "wb_sequence_id",
                "taxTerm": "L4440"
              }, {
                "taxonomy": "condition",
                "taxTerm": "Restrictive"
              }, {
                "taxonomy": "envira-tag",
                "taxTerm": "2016-12-11--PR_Restrictive_N2_L4440"
              }, {
                "taxonomy": "envira-tag",
                "taxTerm": "2016-12-11--PR_RNAi.1.N2.S"
              }, {
                "taxonomy": "envira-tag",
                "taxTerm": "2016-12-11--PR_RNAi.1.N2.S_Restrictive_N2_L4440"
              }, {
                "taxonomy": "envira-tag",
                "taxTerm": "2016-12-11--PR_Restrictive_N2_A01"
              }],
              "taxTerm": "L4440",
              "geneName": "L4440"
            },
            "libraryParent": {
              "wellData": {
                "splitLookUp": ["L4440"],
                "row": "A",
                "origKey": "1",
                "assayWell": "A01"
              },
              "geneName": "L4440",
              "well": "A01"
            },
            "geneName": "L4440"
          });

          done();
        })
        .catch(function(error) {
          done(new Error());
        });
    });

    it('Should run create the ExperimentPlate WpPost', function(done) {
      app.models.Plate.search(workflowData.search.instrument.arrayscan)
        .then(function(platesList) {
          var plate = [platesList[0]];
          return app.models.ExperimentExperimentplate.load.workflows.processVendorPlates(workflowData, plate);
        })
        .then(function(plateInfoList) {
          return app.models.RnaiLibrarystock.load.workflows.processExperimentPlates(workflowData, plateInfoList);
        })
        .then(function(results) {
          return app.models.ExperimentAssay.load.workflows.processExperimentPlates(workflowData, results);
        })
        .then(function(results) {
          return app.models.WpPosts.library.ahringer.load.plate.workflows.processPosts(workflowData, results);
        })
        .then(function(results) {
          //TODO add in a check to make sure we created taxterms, termtaxonomies, and relationships
          expect(results[0]['platePostData']['id']).to.equal(1);
          done();
        })
        .catch(function(error) {
          done(new Error());
        });
    });

    it('Should run create the ExperimentAssay WpPost', function(done) {
      app.models.Plate.search(workflowData.search.instrument.arrayscan)
        .then(function(platesList) {
          var plate = [platesList[0]];
          return app.models.ExperimentExperimentplate.load.workflows.processVendorPlates(workflowData, plate);
        })
        .then(function(plateInfoList) {
          return app.models.RnaiLibrarystock.load.workflows.processExperimentPlates(workflowData, plateInfoList);
        })
        .then(function(results) {
          return app.models.ExperimentAssay.load.workflows.processExperimentPlates(workflowData, results);
        })
        .then(function(results) {
          return app.models.WpPosts.library.ahringer.load.assay.workflows.processExperimentPlates(workflowData, results);
        })
        .then(function(results) {
          //TODO add in a check to make sure we created taxterms, termtaxonomies, and relationships
          // results = JSON.stringify(results);
          // results = JSON.parse(results);
          expect(Object.keys(results[0]['assayPostData'])).to.deep.equal(['id', 'guid', 'postTitle', 'imagePath']);
          done();
        })
        .catch(function(error) {
          done(new Error(error));
        });
    });

  });


});
