'use strict';

const Promise = require('bluebird');

module.exports = function(RnaiRnaiLibrary) {
  RnaiRnaiLibrary.search = function(where) {
    RnaiRnailibrary.find({
      where: where
    })
      .then(function(results) {
        return Promise.resolve(results);
      })
      .catch(function(error) {
        return Promise.reject(new Error(error));
      });
  };
};
