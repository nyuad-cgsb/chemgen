'use strict';

const app = require('../../../../server/server');
const WpTerms = app.models.WpTerms;
const Promise = require('bluebird');
const slug = require('slug');

WpTerms.load.workflows.createTerms = function(postData, createTermObjs) {
  return new Promise(function(resolve, reject){
    Promise.map(createTermObjs, function(createTermObj){
      return WpTerms.load.createTerm(postData.id, createTermObj);
    })
    .then(function(results){
      return app.models.WpTermTaxonomy.load.workflows.processTaxTerms(postData, results);
    })
    .then(function(results){
      resolve(postData);
    })
    .catch(function(error){
      reject(new Error(error));
    });
  });
};

WpTerms.load.createTerm = function(postId, createTermObj) {
  var createTerm = {
    name: createTermObj.taxTerm,
    slug: slug(createTermObj.taxTerm) || '',
    termGroup: 0,
  };

  return new Promise(function(resolve, reject) {
      WpTerms
        .findOrCreate({
          where: app.etlWorkflow.helpers.findOrCreateObj(createTerm),
        }, createTerm)
        .then(function(results) {
          var wanted = prepareTaxTerm(results, createTermObj, postId);
          resolve(wanted);
        })
        .catch(function(error) {
          // If its a duplicate error just find it and return
          if (!error.hasOwnProperty('code')) {
            reject(new Error(error));
          } else if (error.code.match('ER_DUP_ENTRY')) {
            WpTerms
              .findOne({
                where: app.etlWorkflow.helpers.findOrCreateObj(createTerm),
              })
              .then(function(results) {
                var wanted = prepareTaxTerm(results, createTerm, postId);
                resolve(wanted);
              }).catch(function(error) {
                reject(new Error(error));
              });
          } else {
            reject(new Error(error));
          }
        });
  });
}

function prepareTaxTerm(results, createTermObj, postId) {
  var wanted = results[0];
  wanted.postId = postId;
  wanted.taxonomy = createTermObj.taxonomy;
  wanted.term = createTermObj.taxTerm;

  return wanted;
}
