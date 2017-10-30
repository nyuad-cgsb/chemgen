'use strict';

const app = require('../../../../../../server/server');
const Promise = require('bluebird');

const ChemicalChembridgelibrary = app.models.ChemicalChembridgelibrary;

ChemicalChembridgelibrary.extract.parseLibraryResults = function(workflowData, plateInfo, libraryResults) {
  return new Promise(function(resolve, reject) {
    var allWells = workflowData.wells;
    var barcode = plateInfo.ExperimentExperimentplate.barcode;
    var strain = workflowData.data.wormStrain;
    var condition = 'NA';
    var plateId = plateInfo.ExperimentExperimentplate.experimentPlateId;
    var taxID = 'formula';

    Promise.map(allWells, function(well) {
        var libraryResult = ChemicalChembridgelibrary.genLibraryResult(barcode, libraryResults, well);
        var where;
        if (libraryResult.chembridgelibraryId) {
          where = {
            where: {
              chembridgeId: libraryResult.chembridgelibraryId,
            },
          };
        } else {
          where = {
            where: {
              chembridgeId: 'NONE',
            },
          };
        }
        // TODO add ChemicalXrefs to tests
        return app.models.ChemicalChembridgexrefs.extract.genTaxTerms(where)
          .then(function(chemicalTaxTerms) {
            var taxTerms = app.models.WpTerms.load
              .genLibraryTerms(workflowData, plateInfo, libraryResult, condition, strain, well, taxID);
            // For secondary plates we need to add an additional taxTerm for control wells
            chemicalTaxTerms.taxTerms.forEach(function(chemicalTaxTerm) {
              taxTerms.push(chemicalTaxTerm);
            });

            var createStock = {
              plateId: plateId,
              parentstockId: libraryResult.chembridgelibraryId,
              librarystockName: barcode,
              well: well,
              taxTerms: taxTerms,
              taxTerm: libraryResult.chembridgelibraryId || 'chembridge_empty',
              chembridgelibraryId: libraryResult.chembridgelibraryId || 'chembridge_empty',
              metaLibrarystock: JSON.stringify({
                library: 'chembridge',
              }),
            };

            var data = {
              libraryStock: createStock,
              libraryParent: libraryResult,
            };

            return data;
          });
      }, {
        concurrency: 1,
      })
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        reject(new Error(error));
      });
  });
};

ChemicalChembridgelibrary.genLibraryResult = function(barcode, libraryResults, well) {
  var libraryResult = _.find(libraryResults, {
    coordinate: well,
  });

  libraryResult = ChemicalChembridgelibrary.helpers
    .checkLibraryResult(libraryResult);

  return libraryResult;
};


ChemicalChembridgelibrary.extract.findWells = function(plate) {
  return new Promise(function(resolve, reject) {
    ChemicalChembridgelibrary
      .find({
        where: {
          plate: plate,
        },
      })
      .then(function(results) {
        //console.log('chembridgeResults are ' + )
        //resolve(processChembridgeResults(plateInfo, well, results));
        resolve(results);
      })
      .catch(function(error) {
        reject(error);
      });
  });
};
