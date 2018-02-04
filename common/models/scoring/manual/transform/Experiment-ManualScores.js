'use strict';

const app = require('../../../../../server/server');
const Promise = require('bluebird');
const _ = require('lodash');
const jsonfile = require('jsonfile');

const ExperimentManualscores = app.models.ExperimentManualscores;

ExperimentManualscores.transform.buildControlTags = {};

/**
Group data into the different conditions and strains
**/
ExperimentManualscores.transform.workflows
  .score = function(workflowData, screenData) {
    return new Promise(function(resolve, reject) {
      var tensorflowData = [];
      var parentStockIds = ExperimentManualscores.transform
        .getParentStockIds(workflowData, screenData);

      var controlData = ExperimentManualscores.transform
        .buildControlTags[workflowData.screenStage](workflowData, screenData);

      Promise.map(parentStockIds, function(parentstockId) {
        var groupScreenData = ExperimentManualscores.transform
            .findParentStockId(workflowData, screenData, parentstockId);

        return ExperimentManualscores.transform.workflows
            .groupByStrain(workflowData, groupScreenData, groupScreenData)
            .then(function(scoreData) {
              // return app.models.WpPosts.load.score.workflows
              //   .processConditions(workflowData, scoreData, controlData);
              return ExperimentManualscores.transform.workflows.postProcess(workflowData, scoreData, controlData);
            });
      }, {concurrency: 1})
        .then(function(results) {
          return app.models.TensorflowModel.find();
        })
        .then(function(results){
          app.winston.info('Results!');
          // app.winston.info(JSON.stringify(results, null, 2));
          jsonfile.writeFileSync('analysis/FDA-scores-with-counts.json', results, {spaces: 2});
          resolve(results);
        })
        .catch(function(error) {
          app.winston.error(error.stack);
          reject(new Error(error));
        });
    });
  };

ExperimentManualscores.transform.workflows
.postProcess = function(workflowData, scoreData, controlData) {
  return new Promise(function(resolve, reject) {
    app.models.WpPosts.load.score.workflows
    .processConditions(workflowData, scoreData, controlData)
    .then(function(results) {
      return app.models.ExperimentTensorflowcounts.extract.workflows
      .generateCSV(workflowData, scoreData, controlData);
    })
    .then(function(results) {
      resolve(results);
    })
    .catch(function(error) {
      app.winston.error(error.stack);
      reject(new Error(error));
    });
  });
};

// TODO - not every experiment will have a strain - some will have cells or things
// Instead of wormStrain it should be organismType or something
// TODO for the primary there is only 1 replicate
// But for the secondary there are multiple
ExperimentManualscores.transform.workflows
  .groupByStrain = function(workflowData, screenData, groupScreenData) {
    var conditions = workflowData.conditions;
    var strains = workflowData.strains;
    var scoreData = {};

    return new Promise(function(resolve, reject) {
      groupScreenData.map(function(gScreen) {
        var barcode = gScreen.libraryData.libraryStock.librarystockName;
        var strain = app.models[workflowData.libraryModel].helpers
          .wormStrain(barcode);
        var condition = app.models[workflowData.libraryModel].helpers
          .parseCond(barcode);

        if (!scoreData.hasOwnProperty(condition)) {
          scoreData[condition] = {};
        }
        if (!scoreData[condition].hasOwnProperty(strain)) {
          scoreData[condition][strain] = [];
        }

        var screenScoreData = {
          assayPostId: gScreen.assayPostData.id,
          assayId: gScreen.experimentAssayData.assayId,
          plateId: gScreen.experimentAssayData.plateId,
          reagentId: gScreen.experimentAssayData.reagentId,
          taxTerm: gScreen.libraryData.libraryStock.taxTerm,
          taxTerms: gScreen.libraryData.libraryStock.taxTerms,
          parentstockId: gScreen.libraryData.libraryStock.parentstockId,
          barcode: barcode,
          well: gScreen.libraryData.libraryStock.well,
          plateCreationDate: new Date(gScreen.experimentAssayData.plateCreationDate),
        };
        scoreData[condition][strain].push(screenScoreData);
      });

      Object.keys(scoreData).map(function(condition) {
        Object.keys(scoreData[condition]).map(function(strain) {
          var data = scoreData[condition][strain];
          data = _.orderBy(data, 'plateCreationDate', 'asc');
          scoreData[condition][strain] = data;
        });
      });

      resolve(scoreData);
    });
  };

// TODO Merge this with the library.helpers.buildControlTags
// For the primary it is usually on its own plate
// For the secondary it is on the same plate -
// so we just get the well of the M/N and use that
// We get the plateId - and let envira build the gallery from there
ExperimentManualscores.transform
  .buildControlTags.Primary = function(workflowData, screenData) {
    var scoreData = {};
    screenData.map(function(plates) {
      // These are the plates
      // This is an array of wells -  we only need the barcode and the creationDate
      var barcode = plates[0].libraryData.libraryStock.librarystockName;
      if (barcode.match('L4440')) {
        var plateCreationDate = plates[0]
          .experimentAssayData.plateCreationDate;
        var plateId = plates[0].libraryData.libraryStock.plateId;
        var condition = app.models[workflowData.libraryModel].helpers
          .parseCond(barcode);
        var strain = app.models[workflowData.libraryModel].helpers
          .wormStrain(barcode);

        var screenScoreData = {
          barcode: barcode,
          plateCreationDate: new Date(plateCreationDate),
          plateId: plateId,
        };
        if (!scoreData.hasOwnProperty(condition)) {
          scoreData[condition] = {};
        }
        if (!scoreData[condition].hasOwnProperty(strain)) {
          scoreData[condition][strain] = [];
        }

        scoreData[condition][strain].push(screenScoreData);
      }
    });

    Object.keys(scoreData).map(function(condition) {
      Object.keys(scoreData[condition]).map(function(strain) {
        var data = scoreData[condition][strain];
        data = _.orderBy(data, 'plateCreationDate', 'asc');
        scoreData[condition][strain] = data;
      });
    });

    return scoreData;
  };

// This is just a placeholder for now
// TODO This should really be combined the data for the envira gallery
// Just get the envira control tags
// Also return a list of ids -
// For secondary this is just get ids from the same plate where parentstockId == =null
ExperimentManualscores.transform
  .buildControlTags.Secondary = function(workflowData, screenData) {
    var parentstockIds = [];
    var controlIds = {};
    screenData.map(function(screens) {
      screens.map(function(screen) {
        if (screen.libraryData.libraryStock.parentstockId === null) {
          if (! controlIds.hasOwnProperty(screen.experimentAssayData.plateId)) {
            controlIds[screen.experimentAssayData.plateId] = [];
          }
          controlIds[screen.experimentAssayData.plateId]
          .push(screen.experimentAssayData.assayId);
        }
      });
    });
    // app.winston.info(JSON.stringify(controlIds));
    return controlIds;
    // return {};
  };

ExperimentManualscores.transform
  .getParentStockIds = function(workflowData, screenData) {
    // app.winston.info(JSON.stringify(screenData));
    var parentstockIds = [];
    screenData.map(function(screens) {
      screens.map(function(screen) {
        if (screen.libraryData.libraryStock.parentstockId !== null) {
          parentstockIds.push(screen.libraryData.libraryStock.parentstockId);
        }
      });
    });
    var newArray = _.uniq(parentstockIds);
    return newArray;
  };

ExperimentManualscores.transform
  .findParentStockId = function(workflowData, screenData, parentstockId) {
    var assays = screenData.map(function(screens) {
      return _.find(screens, function(o) {
        return o.libraryData.libraryStock.parentstockId === parentstockId;
      });
    });
    return _.remove(assays, function(a) {
      return a != null;
    });
  };
