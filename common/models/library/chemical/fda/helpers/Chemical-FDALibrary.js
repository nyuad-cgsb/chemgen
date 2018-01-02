'use strict';

const app = require('../../../../../../server/server');
const Promise = require('bluebird');

const ChemicalFdalibrary = app.models.ChemicalFdalibrary;

ChemicalFdalibrary.helpers.buildControlTag.Primary = function(workflowData, contentObj) {
  return contentObj;
};

ChemicalFdalibrary.helpers.buildControlTag.Secondary = function(workflowData, contentObj) {
  return contentObj;
};

ChemicalFdalibrary.helpers.buildControlTags = function(workflowData, contentObj) {
  // contentObj.enviraCTCol = 6;
  // contentObj =  ChemicalFdalibrary.helpers.buildControlTag[workflowData.screenStage](workflowData, contentObj);

  return contentObj;
};

ChemicalFdalibrary.helpers.barcodeIsControl = function(barcode) {
  var control = 'not_control';
  if (barcode.match('L4440')) {
    control = 'control';
  }
  return control;
};

/**
Chemical Libraries don't have permissive/restrictive
 */
ChemicalFdalibrary.helpers.parseCond = function(barcode) {
  return 'NA';
};

/**
 * See if its a duplicate
 * @param  {[type]} barcode [Barcode from the arrayscan - RNAiI.1A1_E_D]
 * @return {[type]}         [True/False]
 */
ChemicalFdalibrary.helpers.isDuplicate = function(barcode) {
  if (barcode.match('D')) {
    return 1;
  } else {
    return 0;
  }
};

ChemicalFdalibrary.helpers.getTemp = function(barcode, workflowData) {
  var cond = ChemicalFdalibrary.helpers.parseCond(barcode);
  var temp = 0;
  return temp;
};

/**
 * Library is undef for empty wells
 * Add in a name and a taxTerm
 * @param  {Object | Undefined} libraryResult [Library record for that well]
 * @return {Object}               [Create a library result if it doesn't exist]
 */
ChemicalFdalibrary.helpers.checkLibraryResult = function(libraryResult) {
  if (!libraryResult) {
    libraryResult = {};
    libraryResult.name = 'fda_empty';
    libraryResult.geneName = 'fda_empty';
    // libraryResult.fdalibraryId = 'fda_empty';
    libraryResult.taxTerm = 'fda_empty';
  }
  return libraryResult;
};

/**
Worm Specific
**/
ChemicalFdalibrary.helpers.wormStrain = function(barcode) {
  var strain = 'N2';
  if (barcode.match('M') || barcode.match('mel')) {
    strain = 'M';
  }
  return strain;
};
