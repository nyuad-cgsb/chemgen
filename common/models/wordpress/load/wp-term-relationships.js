'use strict';

const app = require('../../../../server/server');
const WpTermRelationships = app.models.WpTermRelationships;
const Promise = require('bluebird');

WpTermRelationships.load.workflows.createRels = function(postData, termTaxList) {
  return new Promise(function(resolve, reject) {
    Promise.map(termTaxList, function(termTax) {
        var createObj = {
          termTaxonomyId: termTax.termTaxonomyId,
          termOrder: 0,
          objectId: termTax.postId,
        };
        return WpTermRelationships.load.createRel(createObj);
      }, {concurrency: 6})
      .then(function(results) {
        // So far we have no need to do any downstream processing with these results
        // But we will have it results anyways
        resolve(results);
      })
      .catch(function(error) {
        reject(new Error(error));
      });
  });
};

WpTermRelationships.load.createRel = function(termTax) {
  return new Promise(function(resolve, reject) {
      WpTermRelationships
        .findOrCreate({
          where: app.etlWorkflow.helpers.findOrCreateObj(termTax),
        }, termTax)
        .then(function(results) {
          resolve(results[0]);
        })
        .catch(function(error) {
          if (error.message.match('Duplicate') || error.message.match('duplicate')) {
            WpTermRelationships
              .findOne({
                where: app.etlWorkflow.helpers.findOrCreateObj(termTax),
              })
              .then(function(results) {
                resolve(results);
              })
              .catch(function(error) {
                reject(new Error(error));
              });
          } else if (!error.hasOwnProperty('code')) {
            reject(new Error(error));
          } else if (error.code.match('ER_DUP_ENTRY')) {
            WpTermRelationships
              .findOne({
                where: app.etlWorkflow.helpers.findOrCreateObj(termTax),
              })
              .then(function(results) {
                resolve(results);
              })
              .catch(function(error) {
                reject(new Error(error));
              });
          } else {
            reject(new Error(error));
          }
        });
  });
};
