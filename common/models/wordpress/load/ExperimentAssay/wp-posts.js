'use strict';

const app = require('../../../../../server/server');
const Promise = require('bluebird');
const WpPosts = app.models.WpPosts;
const deepcopy = require('deepcopy');
const slug = require('slug');
const Mustache = require('mustache');
const readFile = Promise.promisify(require('fs').readFile);
const path = require('path');

// TODO Most of these are general and do not belong under the tag
WpPosts.load.assay.workflows.processExperimentPlates = function(workflowData, plateDataList) {
  return new Promise(function(resolve, reject) {
    Promise.map(plateDataList, function(plateData) {
      return WpPosts.load.assay.processExperimentPlate(workflowData, plateData);
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

WpPosts.load.assay.processExperimentPlate = function(workflowData, plateData) {
  return new Promise(function(resolve, reject) {
    Promise.map(plateData.experimentAssayList, function(experimentData) {
      return WpPosts.load.assay.workflows.processPost(workflowData, plateData.plateInfo, experimentData);
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

WpPosts.load.assay.workflows.processPost = function(workflowData, plateInfo, experimentData) {
  var taxTerms = experimentData.libraryData.libraryStock.taxTerms;
  var plateId = plateInfo.ExperimentExperimentplate.experimentPlateId;
  var assayId = experimentData.experimentAssayData.assayId;

  return new Promise(function(resolve, reject) {
    WpPosts.load.assay.workflows
      .createPost(workflowData, plateInfo, experimentData)
      .then(function(result) {
        return WpPosts.load.assay.workflows.updatePost(workflowData, plateInfo, experimentData, result);
      })
      .then(function(result) {
        var postData = {
          id: result['id'],
          guid: result['guid'],
          postTitle: result['postTitle'],
          imagePath: experimentData.experimentAssayData.platePath,
        };
        taxTerms.push({
          taxonomy: 'envira-tag',
          taxTerm: postData.postTitle,
        });
        taxTerms.push({
          taxonomy: 'envira-tag',
          taxTerm: 'SN-' + workflowData.screenName + '_PI-' + plateId,
        });
        // experimentData.experimentAssayData.assayId
        taxTerms.push({
          taxonomy: 'envira-tag',
          taxTerm: 'SN-' + workflowData.screenName + '_PI-' + plateId +
           '_AI-' + assayId,
        });
        // Do the downstream processing here
        // Each post should be associated to 1 or more taxonomy terms
        return app.models.WpTerms.load.workflows.createTerms(postData, taxTerms);
      })
      .then(function(results) {
        // experimentData.assayPostData = results;
        return WpPosts.load.assay.workflows.genImagePost(workflowData, results, taxTerms);
      })
      .then(function(results) {
        experimentData.assayPostData = results;
        return app.models.ExperimentAssay.load.updateWithPostData(workflowData, experimentData);
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

WpPosts.load.assay.workflows.updatePost = function(workflowData, plateInfo, experimentData, postObj) {
  var taxTerms = experimentData.libraryData.libraryStock.taxTerms;
  return new Promise(function(resolve, reject) {
    WpPosts.load.assay
      .genPostContent(workflowData, plateInfo, experimentData, taxTerms)
      .then(function(postContent) {
        postObj.postContent = postContent;
        var dateNow = new Date().toISOString();
        postObj.postModified = dateNow;
        postObj.postModifiedGmt = dateNow;
        // This was nuts - the in memory model I used for testing could deal with any of these
        // But the real model could only use updateOrCreate
        // I had to dig around in the tests for mysql data juggler to figure this out
        // return postObj.save;
        // return WpPosts.upsertWithWhere({where: {id: postObj.id}}, postObj);
        // return postObj.updateAttribute({postContent: postContent});
        return WpPosts.updateOrCreate(postObj);
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

// I change the layout of the posts ALL THE TIME
// I will create the initial post - but always have it update to whatever I want
WpPosts.load.assay.workflows.createPost = function(workflowData, plateInfo, experimentData) {
  var plateId = plateInfo.ExperimentExperimentplate.experimentPlateId;
  var title = [plateId, experimentData.experimentAssayData.assayId,
    experimentData.experimentAssayData.assayName,
  ].join('-');
  var titleSlug = slug(title);

  // postContent: postContent,
  var postObj = {
    postAuthor: 1,
    postType: workflowData.library + '_assay',
    commentCount: 0,
    menuOrder: 0,
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
  postObjWithDate.postContent = '';

  return new Promise(function(resolve, reject) {
    WpPosts.findOrCreate({
      where: app.etlWorkflow.helpers.findOrCreateObj(postObj),
    }, postObjWithDate)
      .then(function(results) {
        resolve(results[0]);
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        reject(new Error(error));
      });
  });
};

// TODO Make this more general
// The only thing that is different is the taxTerm
// Everything else is mel28/N2 Permissive/Restrictive
// And possibly how to parse the condition
WpPosts.load.assay.genPostContent = function(workflowData, plateData, experimentData, taxTerms) {
  var barcode = plateData.ExperimentExperimentplate.barcode;
  var plateId = plateData.ExperimentExperimentplate.experimentPlateId;
  var libraryData = experimentData.libraryData;
  var condition = app.models[workflowData.libraryModel].helpers.parseCond(barcode);

  var screenName = workflowData.screenName;
  var taxTerm = libraryData.libraryStock.taxTerm;
  var well = libraryData.libraryStock.well;

  var contentObj = {};
  contentObj.well = well;
  contentObj.plateId = plateId;
  contentObj.condition = condition;
  contentObj.plateUrl = [WpPosts.wpUrl, '/' +
    workflowData.library + '_plate/',
    slug(plateId + '-' + barcode),
  ].join('');
  contentObj.barcode = plateData.ExperimentExperimentplate.barcode;

  // TODO This should be part of the template
  contentObj.table = WpPosts.load.genTermTable(taxTerms);

  contentObj.libraryParent = libraryData.libraryParent;
  contentObj.screenName = workflowData.screenName;
  contentObj.screenNameSlug = slug(workflowData.screenName);
  contentObj.taxTerm = libraryData.libraryStock.taxTerm;
  contentObj.taxTermSlug = slug(libraryData.libraryStock.taxTerm);
  contentObj.wormStrain = workflowData.data.wormStrain;
  contentObj.screenStage = workflowData.screenStage;

  contentObj = WpPosts.load.assay.genEnviraContent(contentObj);
  contentObj = WpPosts.load.assay.genEnviraControl(workflowData, contentObj);

  return new Promise(function(resolve, reject) {
    var templateFile = path.join(path.dirname(__filename), 'templates/' + workflowData.library + 'AssayPost.mustache');
    readFile(templateFile, 'utf8')
      .then(function(contents) {
        var postContent = Mustache.render(contents, contentObj);
        resolve(postContent);
      })
      .catch(function(error) {
        app.winston.error(JSON.stringify(contentObj));
        app.winston.error(error.stack);
        reject(new Error(error));
      });
  });
};

WpPosts.load.assay.genEnviraControl = function(workflowData, contentObj) {
  contentObj.enviraCTCol = 6;

  if (contentObj.barcode.match('L4440')) {
    return contentObj;
  } else {
    contentObj = app.models[workflowData.libraryModel].helpers
      .buildControlTags(workflowData, contentObj);
  }

  return contentObj;
};

WpPosts.load.assay.genEnviraContent = function(contentObj) {
  var emCols = 2;
  if (contentObj.screenStage === 'Secondary') {
    emCols = 8;
  }

  contentObj.enviraCCol = 2;
  contentObj.enviraEMTag = [
    'SN-', contentObj.screenNameSlug,
    '_C-Permissive_WS-M_',
    'TT-', contentObj.taxTermSlug,
    '_W-', contentObj.well,
  ].join('');
  contentObj.enviraEMCol = emCols;
  contentObj.enviraENTag = [
    'SN-', contentObj.screenNameSlug,
    '_C-Permissive_WS-N2_',
    'TT-', contentObj.taxTermSlug,
    '_W-', contentObj.well,
  ].join('');
  contentObj.enviraENCol = emCols;
  contentObj.enviraSMTag = [
    'SN-', contentObj.screenNameSlug,
    '_C-Restrictive_WS-M_',
    'TT-', contentObj.taxTermSlug,
    '_W-', contentObj.well,
  ].join('');
  contentObj.enviraSMCol = emCols;
  contentObj.enviraSNTag = [
    'SN-', contentObj.screenNameSlug,
    '_C-Restrictive_WS-N2_',
    'TT-', contentObj.taxTermSlug,
    '_W-', contentObj.well,
  ].join('');
  contentObj.enviraSNCol = emCols;

  if (contentObj.taxTerm.match('empty')) {
    contentObj.hasTaxTerm = false;
  } else if (contentObj.taxTerm.match('L4440')) {
    contentObj.hasTaxTerm = false;
  } else {
    contentObj.hasTaxTerm = true;
  }

  return contentObj;
};
