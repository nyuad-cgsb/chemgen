'use strict';

const app = require('../../../../../server/server');
const Promise = require('bluebird');
const ChemicalChembridgexrefs = app.models.ChemicalChembridgexrefs;
const decamelize = require('decamelize');

ChemicalChembridgexrefs.extract.genTaxTerms = function(where) {

  return new Promise(function(resolve, reject) {
    ChemicalChembridgexrefs.find(where)
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
