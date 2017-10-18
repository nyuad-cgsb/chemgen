'use strict';

const app = require('../../../../../../server/server');
const Promise = require('bluebird');
const fs = require('fs');
const readFile = Promise.promisify(require('fs')
  .readFile);
const jsonfile = require('jsonfile');
const path = require('path');

const expect = require('chai')
  .expect;
const assert = require('assert');
const util = require('util');
const diff = require('deep-diff')
  .diff;
const nock = require('nock');

const ChemicalChembridgelibrary = app.models.ChemicalChembridgelibrary;

describe('Chembridge Primary', function() {
  it('Should parse barcodes', function() {
    var plateData = ChemicalChembridgelibrary.helpers.parseBarcode('M97');

    expect(plateData).to.deep.equal({
      'plateList': ['97'],
      'Q': 1,
      'plateIndex': '97',
      'plateName': '0097',
    });
    plateData = ChemicalChembridgelibrary.helpers
      .parseBarcode('M97M98M99M100Q1');
    expect(plateData).to.deep.equal({
      'plateList': ['97', '98', '99', '100'],
      'Q': '1',
      'plateIndex': '97',
      'plateName': '0097',
    });
  });
});
