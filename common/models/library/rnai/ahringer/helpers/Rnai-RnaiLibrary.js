'use strict';

const app = require('../../../../../../server/server');
const Promise = require('bluebird');

const RnaiRnailibrary = app.models.RnaiRnailibrary;

RnaiRnailibrary.helpers.buildControlTag.Primary = function(workflowData, contentObj) {
  var cnTag = '_C-Restrictive' + '_WS-N2';
  var cmTag = '_C-Restrictive' + '_WS-M';

  /**
  Restrictive N2
  **/
  contentObj.enviraCRNTag = [
    'SN-', contentObj.screenNameSlug,
    cnTag,
    '_TT-', 'L4440',
  ].join('');

  contentObj.enviraCRMTag = [
    'SN-', contentObj.screenNameSlug,
    cmTag,
    '_TT-', 'L4440',
  ].join('');

  cnTag = '_C-Permissive' + '_WS-N2';
  cmTag = '_C-Permissive' + '_WS-M';

  contentObj.enviraCPNTag = [
    'SN-', contentObj.screenNameSlug,
    cnTag,
    '_TT-', 'L4440',
  ].join('');

  contentObj.enviraCPMTag = [
    'SN-', contentObj.screenNameSlug,
    cmTag,
    '_TT-', 'L4440',
  ].join('');

  return contentObj;
};

RnaiRnailibrary.helpers.buildControlTag.Secondary = function(workflowData, contentObj) {
  var cnTag = '_C-Restrictive' + '_WS-N2';
  var cmTag = '_C-Restrictive' + '_WS-M';

  var strain = RnaiRnailibrary.helpers.wormStrain(contentObj.barcode);

  if (strain === 'M' && contentObj.condition === 'Restrictive') {
    cmTag = '_PI-' + contentObj.plateId + '_C-Restrictive' + '_WS-M';
  } else if (strain === 'N2' && contentObj.condition === 'Restrictive') {
    cnTag = '_PI-' + contentObj.plateId + '_C-Restrictive' + '_WS-N2';
  }

  //Restrictive N2
  contentObj.enviraCRNTag = [
    'SN-', contentObj.screenNameSlug,
    cnTag,
    '_TT-', 'L4440',
  ].join('');

  //Restrictive M
  contentObj.enviraCRMTag = [
    'SN-', contentObj.screenNameSlug,
    cmTag,
    '_TT-', 'L4440',
  ].join('');

  cnTag = '_C-Permissive' + '_WS-N2';
  cmTag = '_C-Permissive' + '_WS-M';
  if (strain === 'M' && contentObj.condition === 'Permissive') {
    cmTag = '_PI-' + contentObj.plateId + '_C-Permissive' + '_WS-M';
  } else if (strain === 'N2' && contentObj.condition === 'Permissive') {
    cnTag = '_PI-' + contentObj.plateId + '_C-Permissive' + '_WS-N2';
  }

  //Permissive N2
  contentObj.enviraCPNTag = [
    'SN-', contentObj.screenNameSlug,
    cnTag,
    '_TT-', 'L4440',
  ].join('');

  //Permissive M
  contentObj.enviraCPMTag = [
    'SN-', contentObj.screenNameSlug,
    cmTag,
    '_TT-', 'L4440',
  ].join('');

  return contentObj;
};

RnaiRnailibrary.helpers.buildControlTags = function(workflowData, contentObj) {
  contentObj.enviraCTCol = 6;
  contentObj = RnaiRnailibrary.helpers
    .buildControlTag[workflowData.screenStage](workflowData, contentObj);

  return contentObj;
};

RnaiRnailibrary.helpers.barcodeIsControl = function(barcode) {
  var control = 'not_control';
  if (barcode.match('L4440')) {
    control = 'control';
  }
  return control;
};

/**
 * Get the quadrant
 * If it matches Q{1-4} - translate to {A,B}{1,2}
 * @param  {object} barcode [Barcode from the arrayscan - RNAiI.1A1_E_D]
 * @return {string}         [{A,B},{1,2}]
 */
RnaiRnailibrary.helpers.getQuad = function(barcode) {
  var codes = {
    Q1: 'A1',
    Q2: 'A2',
    Q3: 'B1',
    Q4: 'B2',
  };

  var plateQuadrant;
  for (var key in codes) {
    if (barcode.match(key)) {
      plateQuadrant = codes[key];
    } else if (barcode.match(codes[key])) {
      plateQuadrant = codes[key];
    }
  }
  if (plateQuadrant) {
    return plateQuadrant;
  } else {
    return 0;
  }
};

RnaiRnailibrary.helpers.getPlate = function(plateNo) {
  if (!plateNo) {
    return '';
  }
  var matches = ['A1', 'B1', 'A2', 'B2', 'Q1', 'Q2', 'Q3', 'Q4'];
  var plate;
  matches.map(function(match) {
    plate = plateNo.replace(match, '');
  });
  return plate;
};

/**
 * Get condition from barcode
 * @param  {[type]} barcode [Barcode from the arrayscan - RNAiI.1A1_E_D]
 * @return {[type]}         [Enhancer/Suppressor] <- NO MORE
 * @return {[type]}         [Permissive/Restrictive]
 */
RnaiRnailibrary.helpers.parseCond = function(barcode) {
  if (barcode.match('E')) {
    return 'Permissive';
  } else if (barcode.match('S')) {
    return 'Restrictive';
  } else {
    return 0;
  }
};

/**
 * See if its a duplicate
 * @param  {[type]} barcode [Barcode from the arrayscan - RNAiI.1A1_E_D]
 * @return {[type]}         [True/False]
 */
RnaiRnailibrary.helpers.isDuplicate = function(barcode) {
  if (barcode.match('D')) {
    return 1;
  } else {
    return 0;
  }
};

RnaiRnailibrary.helpers.getTemp = function(barcode, workflowData) {
  var cond = RnaiRnailibrary.helpers.parseCond(barcode);
  var temp = 0;
  if (cond === 'Permissive') {
    return workflowData.EnhancerTemp || 0;
  } else if (cond === 'Restrictive') {
    return workflowData.SuppressorTemp || 0;
  } else {
    return 0;
  }
  return temp;
};

/**
 * Library is undef for empty wells
 * Add in a name and a taxTerm
 * @param  {Object | Undefined} libraryResult [Library record for that well]
 * @return {Object}               [Create a library result if it doesn't exist]
 */
RnaiRnailibrary.helpers.checkLibraryResult = function(libraryResult) {
  if (!libraryResult) {
    libraryResult = {};
    libraryResult.name = 'ahringer_empty';
    libraryResult.geneName = 'ahringer_empty';
  }
  return libraryResult;
};

/**
Worm Specific
**/
RnaiRnailibrary.helpers.wormStrain = function(barcode) {
  var strain = 'N2';
  if (barcode.match('M') || barcode.match('mel')) {
    strain = 'M';
  }
  return strain;
};

RnaiRnailibrary.search = function(where) {
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
