'use strict';

const app = require('../../../../../../server/server');
const Promise = require('bluebird');

const ChemicalChembridgelibrary = app.models.ChemicalChembridgelibrary;

/**
Chembridge barcodes come in a few different flavors
Sometimes they are

M1M2M3M4Q1 / M1M2M3M4DQ1 - which means plate 1 in the library

And sometimes they are just M1  - which also means plate 1

And sometimes they have an extra number for the duplicate (?)

M229 M230 M231 M232 2DQ4

M97 M98 M99 M100 1DQ1

TODO Write tests
**/

ChemicalChembridgelibrary.helpers.parseBarcode = function(barcode) {
  var origList = barcode.split('M');
  var plateObj;
  if (origList.length === 2) {
    plateObj = ChemicalChembridgelibrary.helpers.singlePlate(origList);
  } else if (origList.length === 5) {
    plateObj = ChemicalChembridgelibrary.helpers.withQuad(origList);
  } else {
    throw (new Error('Unparsable barcode ' + barcode));
  }

  return plateObj;
};

ChemicalChembridgelibrary.helpers.withQuad = function(origList) {
  var last = origList[4];
  var regexp = /(\d{1})DQ(\d{1})/;
  var plateData = regexp.exec(last);
  var pad = '0000';
  var plateObj = {};
  var newLast, plateList, lastPlate;

  if (plateData) {
    newLast = last.replace(plateData[0], '');
    plateList = [origList[1], origList[2], origList[3], newLast];

    plateObj = {
      plateList: plateList,
      Q: plateData[2],
      plateIndex: plateList[plateData[2] - 1],
      D: plateData[1],
    };
  } else {
    regexp = /Q(\d{1})/;

    plateData = regexp.exec(last);

    newLast = last.replace(plateData[0], '');
    plateList = [origList[1], origList[2], origList[3], newLast];

    plateObj = {
      plateList: plateList,
      Q: plateData[1],
      plateIndex: plateList[plateData[1] - 1],
    };
  }

  var plateIndexStr = String(plateObj.plateIndex);
  plateObj.plateName = pad.substring(0, pad.length - plateIndexStr.length) +
    plateIndexStr;

  return plateObj;
};

ChemicalChembridgelibrary.helpers.singlePlate = function(plateList) {
  var regexp = /(\d+)/;
  var plateData = regexp.exec(plateList[1]);
  var pad = '0000';

  var plateObj = {
    plateList: [plateList[1]],
    Q: 1,
    plateIndex: plateData[0],
  };

  var plateIndexStr = String(plateObj.plateIndex);
  plateObj.plateName = pad.substring(0, pad.length - plateIndexStr.length) +
    plateIndexStr;

  return plateObj;
};

/**
 * Library is undef for empty wells
 * Add in a name and a taxTerm
 * @param  {Object | Undefined} libraryResult [Library record for that well]
 * @return {Object}               [Create a library result if it doesn't exist]
 */
ChemicalChembridgelibrary.helpers.checkLibraryResult = function(libraryResult) {
  if (!libraryResult) {
    libraryResult = {};
    libraryResult.name = 'chembridge_empty';
    libraryResult.formula = 'chembridge_empty';
  }
  return libraryResult;
};
