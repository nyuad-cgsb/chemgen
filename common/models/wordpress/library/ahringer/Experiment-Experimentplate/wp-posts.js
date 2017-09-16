'use strict';

const app = require('../../../../../../server/server');
const Promise = require('bluebird');
const WpPosts = app.models.WpPosts;
const deepcopy = require('deepcopy');
const slug = require('slug');

/**
Create the plate post
Loop over plates
  Generate wp Post for a single plate
    Generate the WpTerms
      Generate WpTermTaxonomy
        And associate those back to the post
**/
WpPosts.library.ahringer.load.plate.workflows.processPosts = function(workflowData, platesData) {
  return new Promise(function(resolve, reject) {
    Promise.map(platesData, function(plateData) {
        return WpPosts.library.ahringer.load.plate.processPost(workflowData, plateData);
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

WpPosts.library.ahringer.load.plate.processPost = function(workflowData, plateData) {
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

  var postContent = '';
  postContent = postContent + WpPosts.load.postInfo(workflowData, plateInfo);

  var enviraGallery = [
    '[envira-gallery-dynamic id="tags-',
    slug(workflowData.screenName + '--' + barcode),
    '"]'
  ].join('');

  postContent = postContent + enviraGallery;

  var dateNow = new Date().toISOString();
  var postObjNoDate = {
    postAuthor: 1,
    postType: 'plate',
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

  return new Promise(function(resolve, reject) {
    WpPosts
      .findOrCreate({
        where: app.etlWorkflow.helpers.findOrCreateObj(postObjNoDate),
      }, postObjWithDate)
      .then(function(results) {
        var result = results[0];
        var postData = {id: results[0].id, guid: results[0].guid, postTitle: results[0].postTitle};
        //Do the downstream processing here
        //Each post should be associated to 1 or more taxonomy terms
        return app.models.WpTerms.load.workflows.createTerms(postData, createTermObjs);
      })
      .then(function(results){
        plateData.platePostData = results;
        resolve(plateData);
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        reject(new Error(error));
      });
  });
};

WpPosts.library.ahringer.load.createTags = function(workflowData, tags, plateInfo) {
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
