'use strict';

const app = require('../../../../../../server/server');
const Promise = require('bluebird');
const WpPosts = app.models.WpPosts;
const deepcopy = require('deepcopy');
const slug = require('slug');
const Mustache = require('mustache');
const readFile = Promise.promisify(require('fs').readFile);
const path = require('path');

WpPosts.load.assay.workflows.genScreenPost = function(workflowData, postData, taxTerms) {
  var screenName = workflowData.screenName;
  var geneName = libraryData.libraryStock.geneName;

  var contentObj = {};
  contentObj.plateUrl = [WpPosts.wpUrl, '/plate/', slug(plateId + '-' + barcode)].join('');
  contentObj.enviraCTag = [slug(workflowData.screenName),
    '_',
    slug(app.models.RnaiLibrarystock.helpers.buildControlbarcode(barcode)),
  ].join('');

  contentObj = WpPosts.library.ahringer.load.assay.genEnviraContent(contentObj);

};
