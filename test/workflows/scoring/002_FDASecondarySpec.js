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

// This tests the secondary scoring protocol
var plateData = require('./data/FDA-plateList-Secondary.json');
var workflowData = require('./data/FDA-secondary-workflowData.json');
var scoreData = {
  'NA': {
    'M': [{
      'assayPostId': 601137,
      'assayId': 166802,
      'plateId': 1769,
      'reagentId': 128131,
      'taxTerm': 'F47B3.8',
      'barcode': 'RNAiI.1Q4E_M',
      'well': 'A01',
      'plateCreationDate': new Date('2016-03-22T21:03:01.000Z'),
      'taxTerms': [{'taxonomy': 'condition', 'taxTerm': 'Permissive'}],
    }, {
      'assayPostId': 601041,
      'assayId': 166418,
      'plateId': 1765,
      'reagentId': 127747,
      'taxTerm': 'F47B3.8',
      'barcode': 'RNAiI.1Q4E_D_M',
      'well': 'A01',
      'plateCreationDate': new Date('2016-03-22T21:08:26.000Z'),
      'taxTerms': [{'taxonomy': 'condition', 'taxTerm': 'Permissive'}],
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
      'taxTerms': [{'taxonomy': 'condition', 'taxTerm': 'Permissive'}],
    }, {
      'assayPostId': 601234,
      'assayId': 166898,
      'plateId': 1770,
      'reagentId': 128227,
      'taxTerm': 'F47B3.8',
      'barcode': 'RNAiI.1Q4E_D',
      'well': 'A01',
      'plateCreationDate': new Date('2016-03-22T20:57:34.000Z'),
      'taxTerms': [{'taxonomy': 'condition', 'taxTerm': 'Permissive'}],
    }],
  },
};

describe('It should test the scoring workflow for secondary scores', function() {
  it('Should iterate over the conditions and strains', function(done) {
    app.models.WpPosts.load.score.workflows.processConditions(workflowData, scoreData, {})
    .then(function(results) {
      // app.winston.info(JSON.stringify(results));
      expect(results[0].length).to.equal(2);
      done();
    })
    .catch(function(error) {
      done(new Error(error));
    });
  });
});
