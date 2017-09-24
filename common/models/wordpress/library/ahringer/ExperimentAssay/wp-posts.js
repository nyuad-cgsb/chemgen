'use strict';

const app = require('../../../../../../server/server');
const Promise = require('bluebird');
const WpPosts = app.models.WpPosts;
const deepcopy = require('deepcopy');
const slug = require('slug');
const Mustache = require('mustache');
const readFile = Promise.promisify(require('fs').readFile);
const path = require('path');

// TODO Most of these are general and do not belong under the library.ahringer tag

WpPosts.library.ahringer.load.assay.workflows.processExperimentPlates = function(workflowData, plateDataList) {
  return new Promise(function(resolve, reject) {
    Promise.map(plateDataList, function(plateData) {
      return WpPosts.library.ahringer.load.assay.processExperimentPlate(workflowData, plateData);
    }, {
      concurrency: 1,
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
  });
};

WpPosts.library.ahringer.load.assay.workflows.processPost = function(workflowData, plateInfo, experimentData) {
  var taxTerms = experimentData.libraryData.libraryStock.taxTerms;
  var plateId = plateInfo.ExperimentExperimentplate.experimentPlateId;
  var title = [plateId, experimentData.experimentAssayData.assayId, experimentData.experimentAssayData.assayName].join('-');
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
          id: results[0]['id'],
          guid: results[0]['guid'],
          postTitle: results[0]['postTitle'],
          imagePath: experimentData.experimentAssayData.platePath,
        };
        // Do the downstream processing here
        // Each post should be associated to 1 or more taxonomy terms
        // app.winston.info(JSON.stringify(taxTerms));
        return app.models.WpTerms.load.workflows.createTerms(postData, taxTerms);
      })
      .then(function(results) {
        // experimentData.assayPostData = results;
        // resolve(experimentData);
        return WpPosts.load.assay.workflows.genImagePost(workflowData, results, taxTerms);
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

// TODO Make this more general
// The only thing that is different is the geneName
// Everything else is mel28/N2 Permissive/Restrictive
// And possibly how to parse the condition
WpPosts.library.ahringer.load.assay.genPostContent = function(workflowData, plateData, experimentData, taxTerms) {
  var barcode = plateData.ExperimentExperimentplate.barcode;
  var plateId = plateData.ExperimentExperimentplate.experimentPlateId;
  var libraryData = experimentData.libraryData;
  var condition = app.models.RnaiLibrarystock.helpers.parseCond(barcode);

  var screenName = workflowData.screenName;
  var geneName = libraryData.libraryStock.geneName;

  var contentObj = {};
  contentObj.plateId = plateId;
  contentObj.condition = condition;
  contentObj.plateUrl = [WpPosts.wpUrl, '/plate/', slug(plateId + '-' + barcode)].join('');
  contentObj.barcode = plateData.ExperimentExperimentplate.barcode;

  // TODO This should be part of the template
  contentObj.table = WpPosts.load.genTermTable(taxTerms);

  contentObj.libraryParent = libraryData.libraryParent;
  contentObj.screenName = workflowData.screenName;
  contentObj.screenNameSlug = slug(workflowData.screenName);
  contentObj.geneName = libraryData.libraryStock.geneName;
  contentObj.geneNameSlug = slug(libraryData.libraryStock.geneName);

  contentObj = WpPosts.library.ahringer.load.assay.genEnviraContent(contentObj);
  contentObj = WpPosts.library.ahringer.load.assay.genEnviraControl(workflowData, contentObj);

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

WpPosts.library.ahringer.load.assay.genEnviraControl = function(workflowData, contentObj) {
  contentObj.enviraCTCol = 6;
  if(contentObj.barcode.match('L4440')){
    return contentObj;
  }
  else if (workflowData.screenStage === 'Secondary') {
    contentObj.enviraCTTag = [contentObj.screenNameSlug,
      '_ID_', contentObj.plateId, '_',
      contentObj.geneNameSlug,
    ].join('');
  } else {
    // TODO Check and see if there is one per worm strain and condition, or just condition
    // TODO Not sure if this one will work
    // TODO This should be separated out somewhere
    // Should be screen name, condition, 'L4440', possibly - creationDate?
    var ct = app.models[workflowData.libraryStockModel].helpers.buildControlTag(contentObj.barcode);
    contentObj.enviraCTTag = [contentObj.screenNameSlug,
      '_', ct,
    ].join('');
  }

  return contentObj;
};

WpPosts.library.ahringer.load.assay.genEnviraContent = function(contentObj) {
  contentObj.enviraCCol = 2;
  contentObj.enviraEMTag = [contentObj.screenNameSlug,
    slug('_Permissive_M_'),
    contentObj.geneNameSlug,
  ].join('');
  contentObj.enviraEMCol = 4;
  contentObj.enviraENTag = [contentObj.screenNameSlug,
    slug('_Permissive_N2_'),
    contentObj.geneNameSlug,
  ].join('');
  contentObj.enviraENCol = 4;
  contentObj.enviraSMTag = [contentObj.screenNameSlug,
    slug('_Restrictive_M_'),
    contentObj.geneNameSlug,
  ].join('');
  contentObj.enviraSMCol = 4;
  contentObj.enviraSNTag = [contentObj.screenNameSlug,
    slug('_Restrictive_N2_'),
    contentObj.geneNameSlug,
  ].join('');
  contentObj.enviraSNCol = 4;

  if (contentObj.geneName.match('empty')) {
    contentObj.hasGene = false;
  } else if (contentObj.geneName.match('L4440')) {
    contentObj.hasGene = false;
  } else {
    contentObj.hasGene = true;
  }

  return contentObj;
};
