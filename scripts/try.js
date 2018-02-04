'use strict';

var jsonfile = require('jsonfile');
const _ = require('lodash');
var file = '/home/jillian/Dropbox/projects/NY/chemgen/chemgen-loopback-new/server/model-config.json';
// var things = require(file);
// console.log('things are ' + JSON.stringify(things));
//
const app = require('../server/server.js');
const ExperimentAssay = app.models.ExperimentAssay;
const Promise = require('bluebird');

// jsonfile.readFile(file, function(err, obj) {
//   console.log(obj);
//   console.log('error is ' + JSON.stringify(err));
// });

// var workflowData = {
//   libraryStockModel: 'RnaiLibrarystock',
//   libraryModel: 'RnaiRnailibrary',
//   libraryId: 'rnailibraryId',
//   taxTerm: 'geneName',
// };

//This is a 1 time script to update the ExperimentManualscores table to the correct format
var workflowData = {
  libraryModel: 'ChemicalFdalibrary',
  libraryStockModel: 'ChemicalLibrarystock',
  libraryId: 'fdalibraryId',
  taxTerm: 'fdalibraryId',
};

var pageSize = 100;
var page = 0;

app.models.ExperimentManualscores.load.getScoreCodes()
  .then(function(scoreCodes) {
    return getScores(scoreCodes);
  })
  .then(function(results) {
    // app.winston.info(JSON.stringify(results));
    app.winston.info('Finished');
    process.exit(0);
  })
  .catch(function(error) {
    app.winston.error(JSON.stringify(error.stack));
    app.winston.error('Finished');
    process.exit(1);
  });


function getScores(scoreCodes) {
  return new Promise(function(resolve, reject) {
    var where = {
      manualscoreValue: {
        neq: 0
      },
    };
    app.models.ExperimentManualscores.count({
        where: where
      })
      .then(function(count) {
        app.winston.info('Count: '  + count);
        return app.models.ExperimentManualscores
          .find({
            where: where
          })
      })
      .then(function(results) {
        app.winston.info('Number of results: ' + results.length);
        return mapScores(scoreCodes, results)
      })
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        app.winston.error(JSON.stringify(error.stack));
        reject(new Error(error));
      });
  });
}

function mapScores(scoreCodes, manualScores) {
  return new Promise(function(resolve, reject) {
    Promise.map(manualScores, function(manualScore) {
        // app.winston.info('Score: ' + JSON.stringify(manualScore));
        // return updateScoreParentStock(scoreCodes, manualScore);
        return populateEmpty(scoreCodes, manualScore);
      }, {
        concurrency: 1
      })
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        app.winston.error(JSON.stringify(error.stack));
        reject(new Error(error));
      });
  }, {
    concurrency: 1
  });
}

function updateScoreParentStock(scoreCodes, manualScore) {
  // app.winston.info(JSON.stringify(manualScore));
  return new Promise(function(resolve, reject) {
    ExperimentAssay.extract
      .getParentStockId(workflowData, manualScore.assayId)
      .then(function(results) {
        manualScore.parentstockId = results[workflowData.libraryId];
        manualScore.term = results[workflowData.taxTerm];
        return app.models.ExperimentManualscores.updateOrCreate(manualScore);
      })
      .then(function(results) {
        return updateScoreScreenId(results);
      })
      .then(function(results) {
        return updateScoreCodes(scoreCodes, results);
      })
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        app.winston.error(JSON.stringify(error.stack));
        reject(new Error(error));
      });
  });
}

function updateScoreScreenId(manualScore) {
  return new Promise(function(resolve, reject) {
    ExperimentAssay.extract.getScreenId(workflowData, manualScore.assayId)
      .then(function(results) {
        manualScore.screenId = results.screenId;
        manualScore.screenName = results.name;
        return app.models.ExperimentManualscores.updateOrCreate(manualScore);
      })
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        app.winston.error(JSON.stringify(error.stack));
        reject(new Error(error));
      });
  });
}

function updateScoreCodes(scoreCodes, manualScore) {
  return new Promise(function(resolve, reject) {
    var id = manualScore.scoreCodeId;
    var code = scoreCodes[id];

    manualScore.manualscoreGroup = scoreCodes[id]['manualGroup'];
    manualScore.manualscoreValue = scoreCodes[id]['manualValue'];
    manualScore.manualscoreCode = scoreCodes[id]['formCode'];

    app.models.ExperimentManualscores.updateOrCreate(manualScore)
      .then(function(results) {
        return populateEmpty(scoreCodes, manualScore);
      })
      .then(function(results) {
        resolve(results)
      })
      .catch(function(error) {
        app.winston.error(JSON.stringify(error.stack));
        reject(new Error(error));
      });
  });
}

function populateEmpty(scoreCodes, manualScore) {
  var otherScoreCodes = Object.keys(scoreCodes).map(function(id) {
    return scoreCodes[id];
  });
  var groups = otherScoreCodes.map(function(score) {
    return score.manualGroup;
  });
  groups = _.uniq(groups);

  return new Promise(function(resolve, reject) {
    if (manualScore.manualscoreValue === 0) {
      resolve();
    }

    Promise.map(groups, function(group) {
        var where = {
          where: {
            assayId: manualScore.assayId,
            manualscoreGroup: group,
            timestamp: manualScore.timestamp,
          }
        };
        return app.models.ExperimentManualscores.findOne(where)
          .then(function(result) {
            return findIsCategory(result, otherScoreCodes, group, manualScore);
          });
      }, {
        concurrency: 1
      })
      .then(function(results) {
        resolve()
      })
      .catch(function(error) {
        app.winston.error(JSON.stringify(error.stack));
        reject(new Error(error));
      });

  });
}

function findIsCategory(result, scoreCodes, group, manualScore) {
  return new Promise(function(resolve, reject) {
    var newRecord = {
      "manualscoreGroup": group,
      "screenId": manualScore.screenId,
      "screenName": manualScore.screenName,
      "assayId": manualScore.assayId,
      "parentstockId": manualScore.parentstockId,
      "term": manualScore.term,
      "scorerId": manualScore.scorerId,
      "timestamp": manualScore.timestamp,
      "manualscoreValue": 0,
      "scoreCodeId": 0,
    };
    if (result === null || result === undefined) {
      //If its a category (Weak/Medium/Strong) it will have a 0 category associated with it
      var maybeCat = _.find(scoreCodes, function(scoreCode) {
        return (scoreCode.manualGroup === group && scoreCode.manualValue === 0);
      });
      if (maybeCat === null || maybeCat === undefined) {
        //This means there is no category associated to it
        var cat = _.find(scoreCodes, function(scoreCode) {
          return (scoreCode.manualGroup === group);
        });
        newRecord.manualscoreCode = cat.formCode;
        newRecord.scoreCodeId = cat.manualscorecodeId;
        // resolve(cat)
      } else {
        //There is a category
        newRecord.manualscoreCode = maybeCat.formCode;
        newRecord.scoreCodeId = maybeCat.manualscorecodeId;
        // resolve(maybeCat);
      }

      // WpPosts.findOrCreate({
      //     where: app.etlWorkflow.helpers.findOrCreateObj(postObj),
      //   }, postObjWithDate)
      var find = app.etlWorkflow.helpers.findOrCreateObj(newRecord);
      // app.winston.info('Find is ' + JSON.stringify(find));
      app.models.ExperimentManualscores.findOrCreate({
          where: find
        }, newRecord)
        .then(function(results) {
          // app.winston.info('Created a new score! ' + JSON.stringify(results));
          resolve();
        })
        .catch(function(error) {
          // app.winston.error('NewRecord ' + JSON.stringify(newRecord));
          app.winston.error('Error is ' + error);
          // app.winston.error(JSON.stringify(error.stack));
          // process.exit(1);
          resolve();
          // reject(new Error(error));
        });

    } else {
      resolve();
    }
  });
}
