'use strict';

const app = require('../../../../../../server/server');
const Promise = require('bluebird');
const RnaiRnailibrary = app.models.RnaiRnailibrary;
const slug = require('slug');

// TODO This should be the library - not the librarystock
// There is a 'taxTerm' identifier in the libraryStock, which could be in the workflowData
RnaiRnailibrary.extract.parseLibraryResults = function(workflowData, plateInfo, libraryResults) {
  return new Promise(function(resolve, reject) {
    var allWells = workflowData.wells;
    var barcode = plateInfo.ExperimentExperimentplate.barcode;
    var strain = RnaiRnailibrary.helpers.wormStrain(barcode);
    var condition = RnaiRnailibrary.helpers
      .parseCond(plateInfo.ExperimentExperimentplate.barcode);
    var plateId = plateInfo.ExperimentExperimentplate.experimentPlateId;
    var taxID = 'geneName';

    Promise.map(allWells, function(well) {
        // app.winston.info('Well is :' + well);
        var libraryResult = RnaiRnailibrary.genLibraryResult(barcode, libraryResults, well);
        // TODO add RnaiWbXrefs to tests
        return app.models.RnaiWbXrefs.extract.genTaxTerms({
            where: {
              wbGeneSequenceId: libraryResult.geneName,
            },
          })
          .then(function(wormTaxTerms) {
            var taxTerms = app.models.WpTerms
              .load.genLibraryTerms(workflowData, plateInfo, libraryResult, condition, strain, well, taxID);
            // For secondary plates we need to add an additional taxTerm for control wells
            wormTaxTerms.taxTerms.forEach(function(wormTaxTerm) {
              taxTerms.push(wormTaxTerm);
            });

            //In the primary screen we have an entire barcode with L4440s
            if (barcode.match('L4440')) {
              taxTerms.push({
                taxonomy: 'wb_gene_sequence_id',
                taxTerm: 'L4440'
              });
              libraryResult.geneName = 'L4440';
            }
            //In the secondary screen we have just genes
            else if (libraryResult.geneName === 'L4440') {
              taxTerms.push({
                taxonomy: 'wb_gene_sequence_id',
                taxTerm: 'L4440'
              });
              libraryResult.geneName = 'L4440';
            }
            if (wormTaxTerms.taxTerms.length === 0) {
              taxTerms.push({
                taxonomy: 'wb_gene_sequence_id',
                taxTerm: libraryResult.geneName,
              });
            }

            //TODO Get rid of this geneName nonsense - should just be taxTerm
            // Add parentstockId to workflow definition
            // add taxTerm to workflow defintiion
            var createStock = {
              plateId: plateId,
              parentstockId: libraryResult.rnailibraryId,
              librarystockName: barcode,
              well: well,
              taxTerms: taxTerms,
              taxTerm: libraryResult.geneName,
              geneName: libraryResult.geneName,
              metaLibrarystock: JSON.stringify({
                library: 'ahringer',
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
