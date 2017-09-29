'use strict';

const app = require('../../../../../../server/server');
const Promise = require('bluebird');

const ChemicalChembridgelibrary = app.models.ChemicalChembridgelibrary;

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
