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

var manualScoreCodes = require('./data/Experiment_ManualScoreCode.json');

var scoresFromWP = {
  "userId": "1",
  "userName": "root",
  "scorePostId": "722700",
  "scores": [{
    "name": "M_SEC_PHENO",
    "value": "11"
  }],
  "assayId": "169871",
  "plateId": "1800",
  "libraryModel": "RnaiRnailibrary",
  "libraryStockModel": "RnaiLibrarystock",
  "mutantAssayPostId": "600270",
  "wildTypeAssayPostId": "600075"
};

var scores = {
  assayId: 1,
  plateId: 1,
  mutantAssayPostId: 1,
  wildTypeAssayPostId: 2,
  libraryModel: "RnaiRnailibrary",
  libraryStockModel: "RnaiLibrarystock",
  scorePostId: 2,
  userId: 1,
  userName: 'user',
  scores: [{
    'name': 'C_STE_LETH',
    'value': '53',
  }, {
    'name': 'M_NO_EFFECT',
    'value': '0',
  }, {
    'name': 'M_EMB_LETH',
    'value': '13',
  }, {
    'name': 'M_STE_LETH',
    'value': '16',
  }, {
    'name': 'M_PROB',
    'value': '-4',
  }],
};

var scoreResults = [{
  'manualscoreId': 1,
  'assayId': 1,
  'scoreCodeId': 53,
  'scorerId': 1,
}, {
  'manualscoreId': 2,
  'assayId': 1,
  'scoreCodeId': 0,
  'scorerId': 1,
}, {
  'manualscoreId': 3,
  'assayId': 1,
  'scoreCodeId': 13,
  'scorerId': 1,
}, {
  'manualscoreId': 4,
  'assayId': 1,
  'scoreCodeId': 16,
  'scorerId': 1,
}, {
  'manualscoreId': 5,
  'assayId': 1,
  'scoreCodeId': -4,
  'scorerId': 1,
}];

describe('GetScores Workflow', function() {
  before(function(done) {
    Promise.map(manualScoreCodes, function(scores) {
        return app.models.ExperimentManualscorecode
          .findOrCreate({
            where: {
              manualscorecodeId: scores.manualscorecodeId,
            },
          }, scores);
      })
      .then(function(results) {
        done();
      })
      .catch(function(error) {
        done(new Error(error));
      });
  });

  it('validates the scores', function() {
    var valid = ExperimentManualscores.load.validateScores(scores);
    expect(valid).to.equal(true);
  });
  it('inputs the scores', function(done) {
    ExperimentManualscores.load
      .inputScores(scores)
      .then(function(results) {
        results = JSON.stringify(results);
        results = JSON.parse(results);
        expect(results)
          .to.deep.equal(scoreResults);
        done();
      })
      .catch(function(error) {
        done(new Error(error));
      });
  });
  it('gets all the manual score codes', function(done) {
    ExperimentManualscores.load.workflows
      .updateAssayPostTax(scores)
      .then(function(results) {
        var firstResult = {
          'manualscorecodeId': 1,
          'description': 'Weak suppression in the mutant',
          'shortDescription': 'Weak SUP',
          'formName': 'M_SUP',
          'formCode': 'M_WEAK_SUP',
        };
        results = JSON.stringify(results);
        results = JSON.parse(results);
        expect(results['1']).to.deep.equal(firstResult);
        done();
      })
      .catch(function(error) {
        done(new Error(error));
      });
  });

  it('updates the taxonomy to scored: 1', function(done) {
    ExperimentManualscores.load.updateScorePostTax(scores)
      .then(function(results) {
        return app.models.WpTerms.find();
      })
      .then(function(results) {
        app.winston.info(JSON.stringify(results, null, 2));
        results = JSON.stringify(results);
        results = JSON.parse(results);
        expect(results[results.length - 1]).to.deep.equal({termId: 17, name: "yes", slug: "yes", termGroup: 0 });
        done();
      })
      .catch(function(error) {
        done(new Error(error));
      });
  });
});
