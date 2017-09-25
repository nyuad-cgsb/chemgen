'use strict';

const app = require('../../../../../server/server');
const Promise = require('bluebird');
const WpPosts = app.models.WpPosts;
const deepcopy = require('deepcopy');
const slug = require('slug');
const Mustache = require('mustache');
const readFile = Promise.promisify(require('fs').readFile);
const path = require('path');

WpPosts.load.assay.workflows.genImagePost = function(workflowData, postData, taxTerms) {
  var postObj = {
    postAuthor: 1,
    postType: 'attachment',
    postMimeType: 'image/jpeg',
    commentCount: 0,
    menuOrder: 0,
    postContent: '',
    postStatus: 'inherit',
    postTitle: postData.postTitle + '.jpeg',
    postName: postData.postTitle,
    postParent: 0,
    pingStatus: 'closed',
    commentStatus: 'open',
    guid: WpPosts.wpUrl + '/wp-content/uploads/' + postData.imagePath,
  };

  var dateNow = new Date().toISOString();
  var postObjWithDate = deepcopy(postObj);
  postObjWithDate.postDate = dateNow;
  postObjWithDate.postDateGmt = dateNow;

  return new Promise(function(resolve, reject){
    WpPosts
      .findOrCreate({
        where: app.etlWorkflow.helpers.findOrCreateObj(postObj),
      }, postObjWithDate)
      .then(function(results) {
        var result = results[0];
        var imagePostData = {
          id: results[0]['id'],
          guid: results[0]['guid'],
          postTitle: results[0]['postTitle'],
        };
        return app.models.WpTerms.load.workflows.createTerms(imagePostData, taxTerms);
      })
      .then(function(results){
        return processImagePostMeta(postData, results);
      })
      .then(function(results) {
        resolve(postData);
      })
      .catch(function(error) {
        reject(new Error(error));
      });
  });
};

//This should be in the PostMeta
var processImagePostMeta = function(assayPostData, assayImagePostData) {
  var baseImage = deepcopy(assayPostData.imagePath);
  baseImage = baseImage.replace('.jpeg', '');

  return new Promise(function(resolve, reject) {
    var createObjs = [
      {
        postId: assayPostData.id,
        metaKey: '_thumbnail_id',
        metaValue: assayImagePostData.id,
      },
      {
        postId: assayImagePostData.id,
        metaKey: '_wp_attached_file',
        metaValue: assayPostData.imagePath,
      },
      {
        postId: assayImagePostData.id,
        metaKey: '_wp_attachment_metadata',
        metaValue: WpPosts.load.genImageMeta(baseImage),
      },
    ];

    app.models.WpPostmeta
      .findOrCreateMany(createObjs)
      .then(function(results) {
        resolve(results);
      })
      .catch(function(error) {
        reject(new Error(error));
      });
  });
};
