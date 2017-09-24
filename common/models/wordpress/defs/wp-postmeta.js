'use strict';

const Promise = require('bluebird');
const app = require('../../../../server/server');

module.exports = function(WpPostmeta) {

  WpPostmeta.findOrCreateMany = function(createObjs) {
    return new Promise(function(resolve, reject) {

      Promise.map(createObjs, function(createObj) {
          return WpPostmeta
            .findOrCreate({
              where: app.etlWorkflow.helpers.findOrCreateObj(createObj),
            }, createObj);
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
};
