'use strict';

const app = require('../../../../server/server');
const WpTermTaxonomy = app.models.WpTermTaxonomy;
const Promise = require('bluebird');
const slug = require('slug');

/**
WpTaxonomies are a way of creating custom categories We create taxonomies for
things like barcodes, imaging dates, worm straings, etc
**/
WpTermTaxonomy.load.workflows.processTaxTerms = function(postData, taxTermList) {
  return new Promise(function(resolve, reject) {
    Promise.map(taxTermList, function(taxTerm) {
        return WpTermTaxonomy.load.processTaxTerm(postData.id, taxTerm);
      })
      .then(function(results) {
        return app.models.WpTermRelationships.load.workflows.createRels(postData, results);
      })
      .then(function(results){
        resolve(results);
      })
      .catch(function(error) {
        reject(new Error(error));
      });
  });
};

/**
At some point we should have some sort of cron job that does an actual count
For now we just throw it in there as 1
**/
WpTermTaxonomy.load.processTaxTerm = function(postId, taxTerm) {
  var createTermTaxonomyObj = {
    termId: taxTerm.termId,
    term: taxTerm.term,
    taxonomy: taxTerm.taxonomy,
    description: '',
    parent: 0,
    count: 1,
  };
  return new Promise(function(resolve, reject) {
    WpTermTaxonomy
      .findOrCreate({
        where: {
          and: [{
              taxonomy: createTermTaxonomyObj.taxonomy,
            },
            {
              termId: createTermTaxonomyObj.termId,
            },
          ],
        },
      }, createTermTaxonomyObj)
      .then(function(results) {
        resolve({
          term: results[0].term,
          termId: results[0].termId,
          postId: postId,
          termTaxonomyId: results[0].termTaxonomyId,
        });
      })
      .catch(function(error) {
        if (!error.hasOwnProperty('code')) {
          reject(new Error(error));
        } else if (error.code.match('ER_DUP_ENTRY')) {
          WpTermTaxonomy
            .findOne({
              where: helpers.findOrCreateObj(createTermTaxonomyObj),
            })
            .then(function(results) {
              resolve({
                term: results[0].term,
                termId: results[0].termId,
                postId: postId,
                termTaxonomyId: results[0].termTaxonomyId,
              });
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
