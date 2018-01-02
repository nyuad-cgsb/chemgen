'use strict';

const app = require('../../../server/server');

const _ = require('lodash');
const path = require('path');
const expect = require('chai')
  .expect;
const assert = require('assert');
const Promise = require('bluebird');
const util = require('util');
const diff = require('deep-diff')
  .diff;

const ExperimentManualscores = app.models.ExperimentManualscores;

//This tests the primary scoring workflows

var plateData = require('./plateListRnai.1.Q4E.json');
var screenData = require('./screenDataRnai.1.Q4E.json');
var workflowData = require('./workflowData.json');
var workflowDataFile = path.resolve(__dirname, 'workflowData.json');
var scoreData = {
  'Permissive': {
    'M': [{
      'assayPostId': 601137,
      'assayId': 166802,
      'plateId': 1769,
      'reagentId': 128131,
      'taxTerm': 'F47B3.8',
      'barcode': 'RNAiI.1Q4E_M',
      'well': 'A01',
      'plateCreationDate': new Date('2016-03-22T21:03:01.000Z'),
    }, {
      'assayPostId': 601041,
      'assayId': 166418,
      'plateId': 1765,
      'reagentId': 127747,
      'taxTerm': 'F47B3.8',
      'barcode': 'RNAiI.1Q4E_D_M',
      'well': 'A01',
      'plateCreationDate': new Date('2016-03-22T21:08:26.000Z'),
    }],
    'N2': [{
      'assayPostId': 601333,
      'assayId': 166994,
      'plateId': 1771,
      'reagentId': 128323,
      'taxTerm': 'F47B3.8',
      'barcode': 'RNAiI.1Q4E',
      'well': 'A01',
      'plateCreationDate': new Date('2016-03-22T20:52:09.000Z'),
    }, {
      'assayPostId': 601234,
      'assayId': 166898,
      'plateId': 1770,
      'reagentId': 128227,
      'taxTerm': 'F47B3.8',
      'barcode': 'RNAiI.1Q4E_D',
      'well': 'A01',
      'plateCreationDate': new Date('2016-03-22T20:57:34.000Z'),
    }],
  },
};
var controlData = {
  'Permissive': {
    'N2': [{
      'barcode': 'L4440E',
      'plateCreationDate': new Date('2016-03-23T00:08:31.000Z'),
      'plateId': 1764,
    }, {
      'barcode': 'L4440E_D',
      'plateCreationDate': new Date('2016-03-23T00:13:59.000Z'),
      'plateId': 1763,
    }],
    'M': [{
      'barcode': 'L4440E_M',
      'plateCreationDate': new Date('2016-03-23T00:19:26.000Z'),
      'plateId': 1761,
    }, {
      'barcode': 'L4440E_D_M',
      'plateCreationDate': new Date('2016-03-23T00:24:52.000Z'),
      'plateId': 1760,
    }],
  },
};

describe('001_AhringerScoringSpec', function() {
  it('Should return parentstockIDs', function() {
    var keys = _.range(252, 341, 1);
    var parentstockIds = ExperimentManualscores.transform
    .getParentStockIds(workflowData, screenData);
    expect(keys)
      .to.deep.equal(parentstockIds);
  });

  it('Should find the 252 parentstockIds', function() {
    var parentstockIds = ExperimentManualscores.transform
      .findParentStockId(workflowData, screenData, 252);
    expect(parentstockIds[0].experimentAssayData.assayName)
      .to.equal('RNAiI.1Q4E_A01');
    expect(parentstockIds[1].experimentAssayData.assayName)
      .to.equal('RNAiI.1Q4E_D_A01');
    expect(parentstockIds[2].experimentAssayData.assayName)
      .to.equal('RNAiI.1Q4E_M_A01');
    expect(parentstockIds[3].experimentAssayData.assayName)
      .to.equal('RNAiI.1Q4E_D_M_A01');
  });

  it('Should group the 252 into N ND M MD', function(done) {
    var parentstockIds = ExperimentManualscores.transform
      .findParentStockId(workflowData, screenData, 252);
    ExperimentManualscores.transform.workflows
      .groupByStrain(workflowData, screenData, parentstockIds)
      .then(function(results) {
        // app.winston.info('Results are ' + JSON.stringify(results));
        expect(Object.keys(results))
          .to.deep.equal(['Permissive']);
        done();
      })
      .catch(function(error) {
        done(new Error(error));
      });
  });

  it('Should get the control barcodes', function() {
    var controls = ExperimentManualscores.transform
      .buildControlTags.Primary(workflowData, screenData);
    expect(controls)
      .to.deep.equal(controlData);
  });

  // it('Should test the entire scoring workflow', function(done) {
  //   ExperimentManualscores.transform.workflows
  //     .score(workflowData, screenData)
  //     .then(function(results) {
  //       expect(results.length)
  //         .to.equal(89);
  //       done();
  //     })
  //     .catch(function(error) {
  //       done(new Error(error));
  //     });
  // });
  //
  // it('Should do fancy promises', function(done) {
  //   ExperimentManualscores.transform.workflows
  //     .score(workflowData, screenData)
  //     .then(function(results) {
  //       expect(results.length)
  //         .to.equal(89);
  //       done();
  //     })
  //     .catch(function(error) {
  //       done(new Error(error));
  //     });
  // });
  // it('Should test the entire scoring workflow', function(done) {
  //   app.models.WpPosts.load.score.workflows
  //     .processConditions(workflowData, scoreData, controlData)
  //     .then(function(results) {
  //       // app.winston.info(JSON.stringify(results, null, 2));
  //       done();
  //     })
  //     .catch(function(error) {
  //       done(new Error(error));
  //     });
  // });

  // it('Should tell me there are rnai_ep posts', function(done){
  //   app.models.WpPosts
  //   .find({where: {postType: 'rnai_ep'}})
  //   .then(function(results){
  //     expect(results.length).to.equal(89);
  //     done();
  //   })
  //   .catch(function(error){
  //     done(new Error(error));
  //   });
  // });
});
