'use strict';

const app = require('../../../../../../server/server');
const Promise = require('bluebird');
const _ = require('lodash');

const ChemicalFdalibrary = app.models.ChemicalFdalibrary;

/**
TODO
This should be moved to the Chembridge library models
**/
ChemicalFdalibrary.extract.parseLibraryResults = function(workflowData, plateInfo, libraryResults) {
  return new Promise(function(resolve, reject) {
    var allWells = workflowData.wells;
    var barcode = plateInfo.ExperimentExperimentplate.barcode;
    var strain = ChemicalFdalibrary.helpers.wormStrain(barcode);
    workflowData.data.wormStrain = strain;
    var condition = 'NA';
    var plateId = plateInfo.ExperimentExperimentplate.experimentPlateId;

    Promise.map(allWells, function(well) {
        var libraryResult = ChemicalFdalibrary.genLibraryResult(barcode, libraryResults, well);

        return ChemicalFdalibrary.extract.genTaxTerms(libraryResult)
          .then(function(chemicalTaxTerms) {
            var taxTerms = app.models.WpTerms.load
              .genLibraryTerms(workflowData, plateInfo, libraryResult, condition, strain, well, 'taxTerm');
            // For secondary plates we need to add an additional taxTerm for control wells
            chemicalTaxTerms.taxTerms.forEach(function(chemicalTaxTerm) {
              taxTerms.push(chemicalTaxTerm);
            });

            var createStock = {
              plateId: plateId,
              parentstockId: libraryResult.fdalibraryId,
              librarystockName: barcode,
              well: well,
              taxTerms: taxTerms,
              taxTerm: libraryResult.taxTerm,
              fdalibraryId: libraryResult.taxTerm,
              metaLibrarystock: JSON.stringify({
                library: 'fda',
              }),
            };

            createStock.taxTerm = String(createStock.taxTerm);
            // app.winston.info(JSON.stringify(taxTerms));

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

/** For the secondary screen this should be well
 But possibly for the primary screen should be coordinate?
**/
ChemicalFdalibrary.genLibraryResult = function(barcode, libraryResults, well) {
  var libraryResult = _.find(libraryResults, {
    well: well,
  });

  libraryResult = app.models.ChemicalFdalibrary.helpers
    .checkLibraryResult(libraryResult);

  return libraryResult;
};

/**
TODO Fix this
Need to make sure that these are all defined
Until then they show up on the main page and are searchable
**/
ChemicalFdalibrary.extract.genTaxTerms = function(libraryResult) {
  var newlibraryResult = JSON.stringify(libraryResult);
  newlibraryResult = JSON.parse(newlibraryResult);
  return new Promise(function(resolve, reject) {
    var taxTerms = [];

    if (newlibraryResult.hasOwnProperty('molecularName') && newlibraryResult.molecularName) {
      taxTerms.push({
        taxonomy: 'fda_molecular_name',
        taxTerm: newlibraryResult.molecularName,
      });
    }
    if (newlibraryResult.hasOwnProperty('formula') && newlibraryResult.formula) {
      taxTerms.push({
        taxonomy: 'fda_formula',
        taxTerm: newlibraryResult.formula,
      });
    }
    if (newlibraryResult.hasOwnProperty('casNum') && newlibraryResult.casNum) {
      taxTerms.push({
        taxonomy: 'fda_cas_num',
        taxTerm: newlibraryResult.casNum,
      });
    }
    if (newlibraryResult.hasOwnProperty('molecularWeight') && newlibraryResult.molecularWeight ) {
      taxTerms.push({
        taxonomy: 'fda_mol_weight',
        taxTerm: newlibraryResult.molWeight,
      });
    }
    if (newlibraryResult.hasOwnProperty('bioactivity') && newlibraryResult.bioactivity) {
      taxTerms.push({
        taxonomy: 'fda_bioactivity',
        taxTerm: newlibraryResult.bioactivity,
      });
    }
    if (newlibraryResult.hasOwnProperty('tradename') &&  newlibraryResult.tradename) {
      taxTerms.push({
        taxonomy: 'fda_tradename',
        taxTerm: newlibraryResult.tradename,
      });
    }

    // app.winston.info(JSON.stringify(taxTerms));

    resolve({
      taxTerms: taxTerms
    });
  });
};
