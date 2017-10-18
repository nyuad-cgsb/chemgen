'use strict';

const app = require('../../../../../server/server');
const Promise = require('bluebird');
const WpPosts = app.models.WpPosts;

//TODO Move this to terms
//This doesn't get called...
WpPosts.library.chembridge.load.createTags = function(workflowData, tags, plateInfo) {
  var barcode = plateInfo.ExperimentExperimentplate.barcode;
  var shortBarcode = barcode.replace('_D', '');

  //TODO add checks for undefined values
  tags.push({
    taxonomy: 'assay_date',
    taxTerm: workflowData.assayDate,
  });

  if (workflowData.data.wormStrain) {
    tags.push({
      taxonomy: 'worm_strain',
      taxTerm: workflowData.data.wormStrain,
    });
  }

  return tags;
};
