'use strict';

const app = require('../../../../../server/server');
const Promise = require('bluebird');
const _ = require('lodash');

const ExperimentManualscores = app.models.ExperimentManualscores;

ExperimentManualscores.load.workflows.parseScores = function(scores) {

  return new Promise(function(resolve, reject) {
    var valid = ExperimentManualscores.load.validateScores(scores);
    if (valid === false) {
      reject(new Error('ScoreData does not have correct structure'));
    }

    ExperimentManualscores.load.getScoreCodes()
    .then(function(results){
      return ExperimentManualscores.load.inputScores(results, scores)
    })
      .then(function(results) {
        return ExperimentManualscores.load.updateScorePostTax(scores);
      })
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        reject(new Error(error.stack));
      });
  });
};

ExperimentManualscores.load.validateScores = function(scores) {
  var keys = [
    'assayId',
    'plateId',
    'mutantAssayPostId',
    'wildTypeAssayPostId',
    'scorePostId',
    'userName',
    'userId',
    'scores'
  ];
  var valid = true;
  keys.forEach(function(key) {
    if (!scores.hasOwnProperty(key)) {
      app.winston.error('missing key: ' + key);
      valid = false;
    }
  });
  return valid;
};

ExperimentManualscores.load.inputScores = function(scoreCodes, scoresObj) {
  return new Promise(function(resolve, reject) {
    Promise.map(scoresObj.scores, function(scores) {
      var createObj = {
          assayId: scoresObj.assayId,
          scorerId: scoresObj.userId,
          scoreCodeId: scores.value,
          parentstockId: scoresObj.parentstockId,
          screenId: scoresObj.screenId,
          screenName: scoresObj.screenName,
          term: scoresObj.term,
          manualscoreGroup: scoreCodes[scores.value]['manualGroup'],
          manualscoreCode: scoreCodes[scores.value]['formCode'],
          manualscoreValue: scoreCodes[scores.value]['manualValue'],
        };
        app.winston.info('ScoreCode: ' + JSON.stringify(scoreCodes[scores.value]));
        app.winston.info('CreateObj : ' + JSON.stringify(createObj));
        return ExperimentManualscores.create(createObj);
      })
      .then(function(results) {
        app.winston.info('There are scores! ' + JSON.stringify(results));
        resolve(results);
      })
      .catch(function(error) {
        reject(new Error(error.stack));
      });;
  });
};

ExperimentManualscores.load.updateScorePostTax = function(scoresObj) {
  var taxTerms = [{
    taxonomy: 'scored',
    taxTerm: 'yes',
  }];
  var posts = [{
    id: scoresObj.scorePostId
  }, {
    id: scoresObj.mutantAssayPostId
  }, {
    id: scoresObj.wildTypeAssayPostId
  }];
  return new Promise(function(resolve, reject) {
    Promise.map(posts, function(postObj) {
        return app.models.WpTerms.load.workflows.createTerms(postObj, taxTerms)
      }, {
        concurrency: 4
      })
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        reject(new Error(error.stack));
      });
  });
};

ExperimentManualscores.load.workflows.updateAssayPostTax = function(scoresObj) {
  return new Promise(function(resolve, reject) {
    ExperimentManualscores.load.getScoreCodes()
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        reject(new Error(error.stack));
      });
  });
};

ExperimentManualscores.load.getScoreCodes = function() {
  return new Promise(function(resolve, reject) {
    app.models.ExperimentManualscorecode
      .find({})
      .then(function(results) {
        var newResults = _.keyBy(results, function(o) {
          return o.manualscorecodeId;
        });
        resolve(newResults);
      })
      .catch(function(error) {
        reject(new Error(error.stack));
      });
  });
};

// TODO This should get added to the mongodb database
// {
//   assayId: number,
//   plateId: number,
//   userId: number,
//   assayPostId: number,
//   scorePostId: number,
//   userName:   string,
//   scores: [{
//     "name": "C_STE_LETH",
//     "value": "53"
//   }, {
//     "name": "M_NO_EFFECT",
//     "value": "0"
//   }, {
//     "name": "M_EMB_LETH",
//     "value": "13"
//   }, {
//     "name": "M_STE_LETH",
//     "value": "16"
//   }, {
//     "name": "M_PROB",
//     "value": "-4"
//   }]
// }

ExperimentManualscores.score = function(scores) {
  app.winston.info('In scoring!' + JSON.stringify(scores));
  return ExperimentManualscores.load.workflows.parseScores(scores);
};

ExperimentManualscores.remoteMethod('score', {
  accepts: {
    arg: 'scoreCode',
    type: 'object',
  },
  http: {
    verb: 'get'
  },
  returns: {
    arg: 'valid',
    type: 'object',
  },
});
