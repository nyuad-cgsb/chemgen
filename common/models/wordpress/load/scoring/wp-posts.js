'use strict';

const app = require('../../../../../server/server');
const Promise = require('bluebird');

const WpPosts = app.models.WpPosts;

const slug = require('slug');
const php = require('js-php-serialize');
const deepcopy = require('deepcopy');
const Mustache = require('mustache');
const readFile = Promise.promisify(require('fs')
  .readFile);
const path = require('path');

WpPosts.load.score.workflows
  .processConditions = function(workflowData, scoreData, controlData) {
    return new Promise(function(resolve, reject) {
      Promise.map(Object.keys(scoreData), function(condition) {
        return WpPosts.load.score
            .processCondition(workflowData, condition,
              scoreData, controlData);
      }, {concurrency: 1})
        .then(function(results) {
          resolve(results);
        })
        .catch(function(error) {
          app.winston.error(error.stack);
          reject(new Error(error));
        });
    });
  };

WpPosts.load.score.processCondition = function(workflowData, condition, scoreData, controlData) {
  return new Promise(function(resolve, reject) {
    var strains = Object.keys(scoreData[condition]);
    var replicates = scoreData[condition][strains[0]].length;
    Promise.map(scoreData[condition][strains[0]], function(t, index) {
      return WpPosts.load.score.workflows
          .processPost(workflowData, condition, scoreData, controlData, index);
    }, {concurrency: 1})
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        reject(new Error(error));
      });
  });
};

/**
This is the workflow for creating scoring posts
**/
WpPosts.load.score.workflows.processPost = function(workflowData, condition, scoreData, controlData, index) {
  var taxTerms = scoreData[condition][workflowData.mutantStrain][index].taxTerms;

  return new Promise(function(resolve, reject) {
    WpPosts.load.score.workflows
      .createPost(workflowData, condition, scoreData, controlData, index)
      .then(function(postObj) {
        return WpPosts.load.score.workflows
          .updatePost(workflowData, condition, scoreData, controlData, postObj, index);
      })
      .then(function(result) {
        var postData = {
          id: result['id'],
          guid: result['guid'],
          postTitle: result['postTitle'],
        };
        // resolve(postData);
        // Do the downstream processing here
        // Each post should be associated to 1 or more taxonomy terms
        return app.models.WpTerms.load.workflows
        .createTerms(postData, taxTerms);
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

// Per Condition and per Strain
WpPosts.load.score.workflows.createPost = function(workflowData, condition, scoreData, controlData, index) {
  // var condition = 'Permissive';
  // var condition = 'NA';
  var title = [
    scoreData[condition][workflowData.mutantStrain][index].plateId,
    '-',
    scoreData[condition][workflowData.mutantStrain][index].assayId,
  ].join('');
  var titleSlug = slug(title);
  var postType = 'rnai_ep';
  if (workflowData.hasOwnProperty('scorePostType')) {
    postType = workflowData.scorePostType;
  }

  var postObj = {
    postAuthor: 1,
    postType: postType,
    commentCount: 0,
    menuOrder: 0,
    postStatus: 'publish',
    postTitle: title,
    postName: titleSlug,
    postParent: 0,
    pingStatus: 'open',
    commentStatus: 'open',
    guid: WpPosts.wpUrl + '/' + postType + '/' + titleSlug,
  };

  var dateNow = new Date()
    .toISOString();
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

WpPosts.load.score.workflows
  .updatePost = function(workflowData, condition, scoreData, controlData, postObj, index) {
    return new Promise(function(resolve, reject) {
      WpPosts.load.score
        .genPostContent(workflowData, condition, scoreData, controlData, index)
        .then(function(postContent) {
          postObj.postContent = postContent;
          var dateNow = new Date()
            .toISOString();
          postObj.postModified = dateNow;
          postObj.postModifiedGmt = dateNow;
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

// TODO Put wrapper around this
WpPosts.load.score.genPostContent = function(workflowData, condition, scoreData, controlData, index) {
  var screenName = workflowData.screenName;
  var mutantStrain = workflowData.mutantStrain;

  var plateId = scoreData[condition][mutantStrain][index].plateId;
  var assayId = scoreData[condition][mutantStrain][index].assayId;
  var library = workflowData.library;

  var contentObj = {};
  contentObj.condition = condition;
  contentObj.screenStage  = workflowData.screenStage;
  contentObj.url = [WpPosts.wpUrl, '/', library, '_ep/',
    slug(plateId + '-' + assayId),
  ].join('');

  contentObj.scoreData = scoreData;
  contentObj.controlData = controlData;
  contentObj.screenName = screenName;
  contentObj.screenNameSlug = slug(screenName);
  // These are the ids of the Mutant plate/assay
  contentObj.assayId = assayId;
  contentObj.plateId = plateId;

  contentObj.mutantAssayPostId = scoreData[condition][workflowData.mutantStrain][index].assayPostId;
  contentObj.wildTypeAssayPostId = scoreData[condition][workflowData.wildTypeStrain][index].assayPostId;
  contentObj.libraryModel = workflowData.libraryModel;
  contentObj.libraryStockModel = workflowData.libraryStockModel;
  contentObj.screenId = workflowData.screenId || 0;

  contentObj = WpPosts.load.score.genEnviraContent(workflowData, contentObj, index);
  contentObj = WpPosts.load.score
    .genEnviraControl[workflowData.screenStage](workflowData, contentObj, index);

  return new Promise(function(resolve, reject) {
    var templateFile = path.join(path.dirname(__filename), 'templates/scoring.mustache');
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

// TODO M or D?
WpPosts.load.score.genEnviraContent = function(workflowData, contentObj, index) {
  var condition = contentObj.condition;
  var mutantStrain = workflowData.mutantStrain;
  var wildTypeStrain = workflowData.wildTypeStrain;
  var library = workflowData.library;

  contentObj.enviraEMTag = [
    'SN-', contentObj.screenNameSlug,
    '_PI-', contentObj.scoreData[condition][mutantStrain][index].plateId,
    '_AI-', contentObj.scoreData[condition][mutantStrain][index].assayId,
  ].join('');
  contentObj.MUrl = [WpPosts.wpUrl, '/', library, '_assay/',
    slug(contentObj.scoreData[condition][mutantStrain][index].plateId + '-' +
      contentObj.scoreData[condition][mutantStrain][index].assayId + '-' +
      contentObj.scoreData[condition][mutantStrain][index].barcode),
  ].join('');
  contentObj.enviraENTag = [
    'SN-', contentObj.screenNameSlug,
    '_PI-', contentObj.scoreData[condition][wildTypeStrain][index].plateId,
    '_AI-', contentObj.scoreData[condition][wildTypeStrain][index].assayId,
  ].join('');
  contentObj.N2Url = [WpPosts.wpUrl, '/', library, '_assay/',
    slug(contentObj.scoreData[condition][wildTypeStrain][index].plateId + '-' +
      contentObj.scoreData[condition][wildTypeStrain][index].assayId + '-' +
      contentObj.scoreData[condition][wildTypeStrain][index].barcode),
  ].join('');
  return contentObj;
};

WpPosts.load.score.genEnviraControl.Primary = function(workflowData, contentObj, index) {
  var condition = contentObj.condition;
  var mutantStrain = workflowData.mutantStrain;
  var wildTypeStrain = workflowData.wildTypeStrain;
  var library = workflowData.library;

  contentObj.enviraCMTag = [
    'SN-', contentObj.screenNameSlug,
    '_PI-', contentObj.controlData[condition][mutantStrain][index].plateId,
  ].join('');
  contentObj.CMUrl = [WpPosts.wpUrl, '/', library, '_plate/',
    slug(contentObj.controlData[condition][mutantStrain][index].plateId + '-' +
      contentObj.controlData[condition][mutantStrain][index].barcode),
  ].join('');

  contentObj.enviraCTSTag = [
    'SN-', contentObj.screenNameSlug,
    '_PI-', contentObj.controlData[condition][wildTypeStrain][index].plateId,
  ].join('');
  contentObj.CTSUrl = [WpPosts.wpUrl, '/', library, '_plate/',
    slug(contentObj.controlData[condition][wildTypeStrain][index].plateId + '-' +
      contentObj.controlData[condition][wildTypeStrain][index].barcode),
  ].join('');
  return contentObj;
};

WpPosts.load.score.genEnviraControl.Secondary = function(workflowData, contentObj, index) {
  var condition = contentObj.condition;
  var mutantStrain = workflowData.mutantStrain;
  var wildTypeStrain = workflowData.wildTypeStrain;
  var library = workflowData.library;

  contentObj.enviraCMTag = [
    'SN-', contentObj.screenNameSlug,
    '_PI-', contentObj.scoreData[condition][mutantStrain][index].plateId,
    '_WS-', mutantStrain, '_TT-L4440',
  ].join('');
  contentObj.CMUrl = [WpPosts.wpUrl, '/', library, '_plate/',
    slug(contentObj.scoreData[condition][mutantStrain][index].plateId + '-' +
      contentObj.scoreData[condition][mutantStrain][index].barcode),
  ].join('');

  contentObj.enviraCTSTag = [
    'SN-', contentObj.screenNameSlug,
    '_PI-', contentObj.scoreData[condition][wildTypeStrain][index].plateId,
    '_WS-', wildTypeStrain, '_TT-L4440',
  ].join('');
  contentObj.CTSUrl = [WpPosts.wpUrl, '/', library, '_plate/',
    slug(contentObj.scoreData[condition][wildTypeStrain][index].plateId + '-' +
      contentObj.scoreData[condition][wildTypeStrain][index].barcode),
  ].join('');
  return contentObj;
};
