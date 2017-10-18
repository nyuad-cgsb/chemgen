'use strict';

const app = require('../../../../../server/server');
const Promise = require('bluebird');
const RnaiWbXrefs = app.models.RnaiWbXrefs;
const decamelize = require('decamelize');

RnaiWbXrefs.extract.genTaxTerms = function(where) {
  // where: {
  //   wbGeneAccession: data.gene_id
  // }
  // In the RNAI Ahringer library this is geneName
  // gene_id / wb_gene_accession
  // public_name / wb_gene_cgc_name
  // molecular_name / wb_gene_sequence_id

  return new Promise(function(resolve, reject) {
    RnaiWbXrefs.find(where)
      .then(function(results) {
        var taxTerms = [];
        results = JSON.stringify(results);
        results = JSON.parse(results);
        results.forEach(function(result) {
          Object.keys(result).map(function(key) {
            if (result[key]) {
              taxTerms.push({
                taxonomy: decamelize(key),
                taxTerm: result[key]
              });
            }
          });
        });
        resolve({
          xrefs: results,
          taxTerms: taxTerms
        });
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        reject(new Error(error));
      });
  });
};
