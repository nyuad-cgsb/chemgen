'use strict';

const app = require('../../../../../../server/server');
const Promise = require('bluebird');
const WpPosts = app.models.WpPosts;
const deepcopy = require('deepcopy');
const slug = require('slug');
const Mustache = require('mustache');
const readFile = Promise.promisify(require('fs').readFile);
const path = require('path');

WpPosts.library.ahringer.load.assay.workflows.processExperimentPlates = function(workflowData, plateDataList) {
  return new Promise(function(resolve, reject) {
    Promise.map(plateDataList, function(plateData) {
        return WpPosts.library.ahringer.load.assay.processExperimentPlate(workflowData, plateData);
      }, {
        concurrency: 1
      })
      .then(function(results) {
        resolve(results[0]);
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        reject(new Error(error));
      });
  });
};

WpPosts.library.ahringer.load.assay.processExperimentPlate = function(workflowData, plateData) {
  return new Promise(function(resolve, reject) {
    Promise.map(plateData.experimentAssayList, function(experimentData) {
        return WpPosts.library.ahringer.load.assay.workflows.processPost(workflowData, plateData.plateInfo, experimentData);
      })
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        reject(new Error(error));
      });
  })
};

WpPosts.library.ahringer.load.assay.workflows.processPost = function(workflowData, plateInfo, experimentData) {
  var taxTerms = experimentData.libraryData.libraryStock.taxTerms;
  var title = experimentData.experimentAssayData.assayId + '-' + experimentData.experimentAssayData.assayName;
  var titleSlug = slug(title);

  return new Promise(function(resolve, reject) {
    WpPosts.library.ahringer.load.assay.genPostContent(workflowData, plateInfo, experimentData, taxTerms)
      .then(function(postContent) {
        var postObj = {
          postAuthor: 1,
          postType: 'assay',
          commentCount: 0,
          menuOrder: 0,
          postContent: postContent,
          postStatus: 'publish',
          postTitle: title,
          postName: titleSlug,
          postParent: 0,
          pingStatus: 'open',
          commentStatus: 'open',
          guid: WpPosts.wpUrl + '/' + titleSlug,
        };
        var dateNow = new Date().toISOString();
        var postObjWithDate = deepcopy(postObj);
        postObjWithDate.postDate = dateNow;
        postObjWithDate.postDateGmt = dateNow;
        return WpPosts
          .findOrCreate({
            where: app.etlWorkflow.helpers.findOrCreateObj(postObj),
          }, postObjWithDate);
      })
      .then(function(results) {
        var result = results[0];
        var postData = {
          id: results[0].id,
          guid: results[0].guid,
          postTitle: results[0].postTitle,
          imagePath: experimentData.experimentAssayData.platePath
        };
        //Do the downstream processing here
        //Each post should be associated to 1 or more taxonomy terms
        return app.models.WpTerms.load.workflows.createTerms(postData, taxTerms);
      })
      .then(function(results) {
        experimentData.assayPostData = results;
        resolve(experimentData);
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        reject(new Error(error));
      });
  });

};

WpPosts.library.ahringer.load.assay.genPostContent = function(workflowData, plateData, experimentData, taxTerms) {
  var barcode = plateData.ExperimentExperimentplate.barcode;
  var plateId = plateData.ExperimentExperimentplate.experimentPlateId;
  var libraryData = experimentData.libraryData;

  var screenName = workflowData.screenName;
  var geneName = libraryData.libraryStock.geneName;

  var contentObj = {};
  contentObj.plateUrl = [WpPosts.wpUrl, '/plate/', slug(plateId + '-' + barcode)].join('');
  contentObj.barcode = plateData.ExperimentExperimentplate.barcode;

  //TODO This should be part of the template
  contentObj.table = WpPosts.load.genTermTable(taxTerms);

  contentObj.screenName = workflowData.screenName;
  contentObj.screenNameSlug = slug(workflowData.screenName);
  contentObj.geneName = libraryData.libraryStock.geneName;
  contentObj.geneNameSlug = slug(libraryData.libraryStock.geneName);

  //This one is different if it is a custom screen
  contentObj.enviraCTag = [slug(workflowData.screenName),
    '_',
    slug(app.models.RnaiLibrarystock.helpers.buildControlbarcode(barcode))
  ].join('');
  contentObj.enviraCCol = 2;
  contentObj.enviraEMTag = [contentObj.screenNameSlug,
    slug('_Enhancer_M_'),
    contentObj.geneNameSlug,
  ].join('');
  contentObj.enviraEMCol = 4;
  contentObj.enviraENTag = [contentObj.screenNameSlug,
    slug('_Enhancer_N2_'),
    contentObj.geneNameSlug
  ].join('');
  contentObj.enviraENCol = 4;
  contentObj.enviraSMTag = [contentObj.screenNameSlug,
    slug('_Restrictive_M_'),
    contentObj.geneNameSlug
  ].join('');
  contentObj.enviraSMCol = 4;
  contentObj.enviraSNTag = [contentObj.screenNameSlug,
    slug('_Restrictive_N2_'),
    contentObj.geneNameSlug
  ].join('');
  contentObj.enviraSNCol = 4;

  //List all the other Images
  if (contentObj.geneName.match('empty')) {
    contentObj.hasGene = false;
  } else {
    contentObj.hasGene = true;
  }

  // Put this back
  // if (barcode.match('L4440')) {
  //   enviraGallery = buildEnviraControlGallery(workflowData.screenName, barcode);
  //   postTable = '';
  // }
  return new Promise(function(resolve, reject) {
    var templateFile = path.join(path.dirname(__filename), 'templates/assayPost.mustache');
    readFile(templateFile, 'utf8')
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


// var preProcessKue = function(data) {
//   var postData = genAssayPostContent(data);
//   var taxTerms = postData.taxTerms;
//
//   var postMeta = {
//     postContent: postData.postContent,
//     wpUrl: postData.wpUrl,
//     wpUI: data.workflowData.wpUI || 1,
//   };
//   var postObj = genAssayPostMeta(data, postMeta);
//
//   taxTerms.push({
//     taxonomy: 'envira-tag',
//     taxTerm: postObj.postTitle,
//   });
//
//   return [postObj, postMeta, taxTerms];
// };
