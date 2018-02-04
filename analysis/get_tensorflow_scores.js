'use strict';

const path = require('path');
const Promise = require('bluebird');
const fs = require('fs');
const jsonfile = require('jsonfile');
const _ = require('lodash');

const app = require('../server/server.js');
const ExperimentTensorflowcounts  = app.models.ExperimentTensorflowcounts;
const ExperimentManualscores = app.models.ExperimentManualscores;

// I have the output from the experiment
// and I want to group those with their controls
// TODO This is hacky and should be explicit in the database

var scoreData = jsonfile
  .readFileSync(path.resolve(__dirname, 'FDA_scoring_experiment_results.json'));
var controlData = jsonfile
  .readFileSync(path.resolve(__dirname, 'FDA_scoring_control_results.json'));

// Normally there are enhancher/suppressor
// But today noooo
// var conditions = Object.keys(scoreData);
var condition = 'NA';
var strains = ['M', 'N2'];

/// This is an FDA screen - no enhancer/suppressor
var parseThis = scoreData['NA']['M'];

// These are the categories - manualscoreGroup
// M_EMB_LETH
// WT_EMB_LETH
// M_ENH_STE
// WT_ENH_STE
// I want the values = manualscoreValue
// 0,1,2,3
  return ExperimentTensorflowcounts.extract.workflows.generateCSV({}, scoreData, controlData)
  .then(function(results) {
    // app.winston.info('AssayId: ' + mAssay.assayId);
    // app.winston.info(JSON.stringify(results));
  process.exit(0);
    // return results;
  });

// Promise.map(parseThis, function(mAssay, index) {
//   var wtAssay = scoreData['NA']['N2'][index];
//
//   var MControlIds = getControlAssays(mAssay.plateId);
//   var WTControlIds = getControlAssays(wtAssay.plateId);
//
//   // return getScores([{id: mAssay.assayId, group: 'M_EMB_LETH'},
//   //  {id: mAssay.assayId, group: 'WT_EMB_LETH'}])
//   // return doStuff(wtAssay.assayId, mAssay.assayid, 'WT_EMB_LETH', WTControlIds, 'EMB_LETH')
//   return ExperimentTensorflowcounts.extract.workflows.generateCSV(scoreData, controlData)
//   .then(function(results) {
//     // app.winston.info('AssayId: ' + mAssay.assayId);
//     // app.winston.info(JSON.stringify(results));
//     return results;
//   });
// }, {concurrency: 1})
// .then(function(results) {
// });

// var doStuff = function(assayId, scoreId, group, controls, label) {
//   return new Promise(function(resolve, reject) {
//     var scoreObj = {};
//     getTensorflowCount(controls)
//     .then(function(counts) {
//       scoreObj = transformControlCounts(counts, scoreObj);
//       return getScore(scoreId, group);
//     })
//     .then(function(results) {
//       if (results === null) {
//         results = {};
//         results.manualscoreValue = null;
//       }
//       scoreObj.label = results.manualscoreValue;
//       return getTensorflowCount([assayId]);
//     })
//     .then(function(counts) {
//       scoreObj = transformExpCounts(counts, scoreObj);
//       app.winston.info('ScoreObj!');
//       app.winston.info(JSON.stringify(scoreObj, null, 2));
//       resolve(scoreObj);
//     })
//     .catch(function(error) {
//       reject(new Error(error));
//     });
//   });
// };
//
// var transformExpCounts  = function(counts, scoreObj) {
//   if (counts.length === 0) {
//     return {};
//   }  else {
//     scoreObj.Exp_worm_count = counts[0].wormCount;
//     scoreObj.Exp_larva_count = counts[0].larvaCount;
//     scoreObj.Exp_egg_count = counts[0].eggCount;
//     return scoreObj;
//   }
// };
//
// var transformControlCounts = function(counts, scoreObj) {
//   scoreObj.C0_worm_count = counts[0].wormCount;
//   scoreObj.C0_larva_count = counts[0].larvaCount;
//   scoreObj.C0_egg_count = counts[0].eggCount;
//
//   scoreObj.C1_worm_count = counts[1].wormCount;
//   scoreObj.C1_larva_count = counts[1].larvaCount;
//   scoreObj.C1_egg_count = counts[1].eggCount;
//
//   scoreObj.C2_worm_count = counts[2].wormCount;
//   scoreObj.C2_larva_count = counts[2].larvaCount;
//   scoreObj.C2_egg_count = counts[2].eggCount;
//
//   scoreObj.C3_worm_count = counts[3].wormCount;
//   scoreObj.C3_larva_count = counts[3].larvaCount;
//   scoreObj.C3_egg_count = counts[3].eggCount;
//
//   return scoreObj;
// };
//
// var getScores  = function(scores) {
//   return new Promise(function(resolve, reject) {
//     Promise.map(scores, function(idObj) {
//       return getScore(idObj.id, idObj.group);
//     }, {concurrency: 2})
//     .then(function(results) {
//       app.winston.info('Scores!');
//       app.winston.info(JSON.stringify(results));
//       var keyBy = _.keyBy(results, function(o) {
//         if (o !== null) {
//           return o.manualscoreGroup;
//         }
//       });
//
//       app.winston.info(JSON.stringify(keyBy));
//       resolve(keyBy);
//     })
//     .catch(function(error) {
//       reject(new Error(error));
//     });
//   });
// };
//
// var getScore = function(assayId, group) {
//   return new Promise(function(resolve, reject) {
//     ExperimentManualscores.findOne({
//       where: {and: [
//       {assayId: assayId},
//       {manualscoreGroup: group},
//       ],
//       },
//     })
//   .then(function(results) {
//     resolve(results);
//   })
//   .catch(function(error) {
//     reject(new Error(error));
//   });
//   });
// };
//
// var getTensorflowCount = function(ids) {
//   var idObj = ids.map(function(id) {
//     return {assayId: id};
//   });
//
//   return new Promise(function(resolve, reject) {
//     ExperimentTensorflowcounts.find({
//       where: {
//         or: ids.map(function(id) {
//           return {assayId: id};
//         }),
//       },
//     })
//     .then(function(results) {
//       app.winston.info('TensorflowCounts!');
//       app.winston.info(JSON.stringify(results));
//       resolve(results);
//     })
//     .catch(function(error) {
//       reject(new Error(error));
//     });
//   });
// };
//
var getControlAssays = function(plateId) {
  var random = _.shuffle(controlData[plateId]);
  return random.slice(0, 4);
};
