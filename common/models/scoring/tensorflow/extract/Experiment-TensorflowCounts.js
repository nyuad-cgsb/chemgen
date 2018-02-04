'use strict';

const app = require('../../../../../server/server');
const Promise = require('bluebird');
const _ = require('lodash');
const jsonfile = require('jsonfile');

const ExperimentTensorflowcounts  = app.models.ExperimentTensorflowcounts;
const ExperimentManualscores = app.models.ExperimentManualscores;

// WIP
// This is a work in progress
// Do not use it for anything important
// It will break

ExperimentTensorflowcounts.extract.workflows
.generateCSV = function(workflowData, scoreData, controlData) {
// Normally there are enhancher/suppressor
// But today noooo
// var conditions = Object.keys(scoreData);
  var condition = 'NA';
  var strains = ['M', 'N2'];
/// This is an FDA screen - no enhancer/suppressor
  var parseThis = scoreData['NA']['M'];

  return new Promise(function(resolve, reject) {
    Promise.map(parseThis, function(mAssay, index) {
      var wtAssay = scoreData['NA']['N2'][index];

      var MControlIds = getControlAssays(controlData, mAssay.plateId);
      var WTControlIds = getControlAssays(controlData, wtAssay.plateId);

      // TODO Fix this to make it dynamic for EMB_LETH and STE
      var experimentData = [{
        assayId: mAssay.assayId,
        scoreId: mAssay.assayId,
        group: 'M_EMB_LETH',
        controlIds: MControlIds,
        label: 'EMB_LETH',
        isMutant: 1,
      }, {
        assayId: wtAssay.assayId,
        scoreId: mAssay.assayId,
        group: 'WT_EMB_LETH',
        controlIds: WTControlIds,
        label: 'EMB_LETH',
        isMutant: 0,
      },
      ];

      return ExperimentTensorflowcounts.extract.genRows(experimentData)
    .then(function(results) {
      // app.winston.info('AssayId: ' + mAssay.assayId);
      // app.winston.info(JSON.stringify(results));
      return results;
    });
    }, {concurrency: 1})
.then(function(results) {
  // app.winston.info(JSON.stringify(results));
  resolve(results);
});
  });
};

// This generates a single row in our csv
// Looks like:
// Cn_worm_count
// Cn_larva_count
// Cn_egg_count
// Exp_worm_count
// Exp_larva_count
// Exp_egg_count
// This should really be under transform...
ExperimentTensorflowcounts.extract.genRows = function(experiments) {
  return new Promise(function(resolve, reject) {
    Promise.map(experiments, function(experimentData) {
      var assayId = experimentData.assayId;
      var scoreId = experimentData.scoreId;
      var group = experimentData.group;
      var controls = experimentData.controlIds;
      var label = experimentData.label;
      var scoreObj = {};
      scoreObj.isMutant = experimentData.isMutant;
      scoreObj.assayId = experimentData.assayId;
      return getTensorflowCount(controls)
    .then(function(counts) {
      scoreObj = transformControlCounts(counts, scoreObj);
      return getScore(scoreId, group);
    })
    .then(function(results) {
      if (results === null) {
        results = {};
        results.manualscoreValue = null;
      }
      scoreObj.score = results.manualscoreValue;
      return getTensorflowCount([assayId]);
    })
    .then(function(counts) {
      scoreObj = transformExpCounts(counts, scoreObj);
      // app.winston.info(JSON.stringify(scoreObj));
      // return app.models.TensorflowModel
      // .findOrCreate({where: app.etlWorkflow.helpers.findOrCreateObj(scoreObj)}, scoreObj);
      return validateRow(scoreObj);
    })
    .then(function(results) {
      return results[0];
    });
    })
    .then(function(results) {
      resolve(results);
    })
    .catch(function(error) {
      reject(new Error(error));
    });
  });
};

var validateRow = function(scoreObj) {
  return new Promise(function(resolve, reject) {
    if (scoreObj.hasOwnProperty('assayId')) {
      app.models.TensorflowModel
      .findOrCreate({
        where: app.etlWorkflow.helpers.findOrCreateObj(scoreObj)},
        scoreObj)
      .then(function(results) {
        resolve(results[0]);
      })
      .catch(function(error) {
        reject(new Error(error));
      });
    }    else {
      resolve({});
    }
  });
};

var getControlAssays = function(plateId) {
  var random = _.shuffle(controlData[plateId]);
  return random.slice(0, 4);
};

var transformExpCounts  = function(counts, scoreObj) {
  if (counts.length === 0) {
    return {};
  }  else {
    scoreObj.ExpWormCount = counts[0].wormCount;
    scoreObj.ExpLarvaCount = counts[0].larvaCount;
    scoreObj.ExpEggCount = counts[0].eggCount;
    return scoreObj;
  }
};

var transformControlCounts = function(counts, scoreObj) {
  scoreObj.C0WormCount = counts[0].wormCount;
  scoreObj.C0LarvaCount = counts[0].larvaCount;
  scoreObj.C0EggCount = counts[0].eggCount;

  scoreObj.C1WormCount = counts[1].wormCount;
  scoreObj.C1LarvaCount = counts[1].larvaCount;
  scoreObj.C1EggCount = counts[1].eggCount;

  scoreObj.C2WormCount = counts[2].wormCount;
  scoreObj.C2LarvaCount = counts[2].larvaCount;
  scoreObj.C2EggCount = counts[2].eggCount;

  scoreObj.C3WormCount = counts[3].wormCount;
  scoreObj.C3LarvaCount = counts[3].larvaCount;
  scoreObj.C3EggCount = counts[3].eggCount;

  return scoreObj;
};

var getScores  = function(scores) {
  return new Promise(function(resolve, reject) {
    Promise.map(scores, function(idObj) {
      return getScore(idObj.id, idObj.group);
    }, {concurrency: 2})
    .then(function(results) {
      var keyBy = _.keyBy(results, function(o) {
        if (o !== null) {
          return o.manualscoreGroup;
        }
      });

      resolve(keyBy);
    })
    .catch(function(error) {
      reject(new Error(error));
    });
  });
};

var getScore = function(assayId, group) {
  return new Promise(function(resolve, reject) {
    ExperimentManualscores.findOne({
      where: {and: [
      {assayId: assayId},
      {manualscoreGroup: group},
      ],
      },
    })
  .then(function(results) {
    resolve(results);
  })
  .catch(function(error) {
    reject(new Error(error));
  });
  });
};

var getTensorflowCount = function(ids) {
  var idObj = ids.map(function(id) {
    return {assayId: id};
  });

  return new Promise(function(resolve, reject) {
    ExperimentTensorflowcounts.find({
      where: {
        or: ids.map(function(id) {
          return {assayId: id};
        }),
      },
    })
    .then(function(results) {
      resolve(results);
    })
    .catch(function(error) {
      reject(new Error(error));
    });
  });
};

var getControlAssays = function(controlData, plateId) {
  var random = _.shuffle(controlData[plateId]);
  return random.slice(0, 4);
};
