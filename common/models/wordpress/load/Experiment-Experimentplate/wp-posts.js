'use strict';

const app = require('../../../../../server/server');
const Promise = require('bluebird');
const WpPosts = app.models.WpPosts;
const deepcopy = require('deepcopy');
const slug = require('slug');
const Mustache = require('mustache');
const readFile = Promise.promisify(require('fs').readFile);
const path = require('path');

/**
Create the plate post
Loop over plates
  Generate wp Post for a single plate
    Generate the WpTerms
      Generate WpTermTaxonomy
        And associate those back to the post
**/
WpPosts.load.plate.workflows.processPosts = function(workflowData, platesData) {
  return new Promise(function(resolve, reject) {
    Promise.map(platesData, function(plateData) {
        return WpPosts.load.plate.processPost(workflowData, plateData);
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

WpPosts.load.plate.processPost = function(workflowData, plateData) {
  var plateInfo = plateData.plateInfo;
  var experimentAssayList = plateData.experimentAssayList;
  var experimentPlate = plateInfo.ExperimentExperimentplate;
  var barcode = experimentPlate.barcode;
  var imagePath = experimentPlate.imagePath;
  var instrumentPlateId = experimentPlate.instrumentPlateId;
  var plateId = experimentPlate.experimentPlateId;

  var imageArray = imagePath.split('\\');
  var folder = imageArray[4];

  var createTermObjs = WpPosts.load.createTags(workflowData, plateInfo);

  var title = plateId + '-' + barcode;
  var titleSlug = slug(title);

  return new Promise(function(resolve, reject) {
    WpPosts.load.plate.genPostContent(workflowData, plateData)
      .then(function(postContent) {
        var dateNow = new Date().toISOString();
        var postObjNoDate = {
          postAuthor: 1,
          postType: workflowData.library + '_plate',
          commentCount: 0,
          menuOrder: 0,
          postContent: postContent,
          postStatus: 'publish',
          postTitle: title,
          postName: titleSlug,
          postParent: 0,
          pingStatus: 'open',
          commentStatus: 'open',
          guid: WpPosts.wpUrl + titleSlug,
        };
        var postObjWithDate = deepcopy(postObjNoDate);
        postObjWithDate.postDate = dateNow;
        postObjWithDate.postDateGmt = dateNow;
        return WpPosts
          .findOrCreate({
            where: app.etlWorkflow.helpers.findOrCreateObj(postObjNoDate),
          }, postObjWithDate);
      })
      .then(function(results) {
        var result = results[0];
        var postData = {
          id: results[0]['id'],
          guid: results[0]['guid'],
          postTitle: results[0]['postTitle'],
        };
        return app.models.WpTerms.load.workflows
          .createTerms(postData, createTermObjs);
      })
      .then(function(results) {
        plateData.platePostData = results;
        resolve(plateData);
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        reject(new Error(error));
      });
  });
};

WpPosts.load.plate.genPostContent = function(workflowData, plateData) {
  var plateInfo = plateData.plateInfo;
  var experimentPlate = plateInfo.ExperimentExperimentplate;
  var barcode = experimentPlate.barcode;
  var plateId = experimentPlate.experimentPlateId;

  var library = workflowData.library.charAt(0).toUpperCase() +
    workflowData.library.slice(1);

  var enviraGallery = [
    '[envira-gallery-dynamic id="tags-',
    slug('SN-' + workflowData.screenName + '_PI-' + plateId + '_B-' + barcode),
    '" columns="6" limit="100"]',
  ].join('');

  var contentObj = {
    library: library,
    workflowData: workflowData,
    enviraGallery: enviraGallery,
    plateInfo: plateInfo,
  };

  return new Promise(function(resolve, reject) {
    var plateTemplate = path.resolve(__dirname,
      'templates', workflowData.library + 'PlatePost.mustache');
    readFile(plateTemplate, 'utf8')
      .then(function(contents) {
        var postContent = Mustache.render(contents, contentObj);
        resolve(postContent);
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        reject(new Error(error));
      });
  });
};
