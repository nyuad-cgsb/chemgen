'use strict';

const app = require('../../../../../server/server');
const Promise = require('bluebird');
const WpPosts = app.models.WpPosts;

WpPosts.library.ahringer.load.createTags = function(workflowData, tags, plateInfo) {
  // WpPosts.library.ahringer.load.createTags = function(workflowData, tags, plateInfo) {
  var barcode = plateInfo.ExperimentExperimentplate.barcode;
  var shortBarcode = barcode.replace('_D', '');

  //TODO add checks for undefined values
  tags.push({
    taxonomy: 'rnai_assay_date',
    taxTerm: workflowData.assayDate
  });
  tags.push({
    taxonomy: 'rnai_enhancer_temp',
    taxTerm: workflowData.EnhancerTemp
  });
  tags.push({
    taxonomy: 'rnai_suppressor_temp',
    taxTerm: workflowData.SuppressorTemp
  });

  if (barcode) {
    if (barcode.match('M') || barcode.match('mel')) {
      tags.push({
        taxonomy: 'worm_strain',
        taxTerm: 'mel-28',
      });
    } else {
      tags.push({
        taxonomy: 'worm_strain',
        taxTerm: 'N2',
      });
    }
  }

  return tags;
};
