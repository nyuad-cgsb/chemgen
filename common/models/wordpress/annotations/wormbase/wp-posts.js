'use strict';

const app = require('../../../../../server/server');
const WpPosts = app.models.WpPosts;
const Promise = require('bluebird');
const slug = require('slug');
const deepcopy = require('deepcopy');
const Mustache = require('mustache');
const readFile = Promise.promisify(require('fs').readFile);
const path = require('path');
const decamelize = require('decamelize');

WpPosts.load.annotations.wormbase.fn_desc.workflows.processData = function(data) {
  return new Promise(function(resolve, reject) {
    app.models.RnaiWbXrefs.extract.genTaxTerms({
        where: {
          wbGeneAccession: data.gene_id
        }
      })
      .then(function(xrefData) {
        return WpPosts.load.annotations.wormbase.fn_desc.workflows.createPost(xrefData, data);
      })
      .then(function(results) {
        app.winston.info(JSON.stringify(results));
        resolve(results);
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        reject(new Error(error));
      });
  });
};

WpPosts.load.annotations.wormbase.fn_desc.workflows.createPost = function(xrefData, data) {
  return new Promise(function(resolve, reject) {
    WpPosts.load.annotations.wormbase.fn_desc.genPostContent(xrefData, data)
      .then(function(postContent) {
        var dateNow = new Date().toISOString();
        var postObj = {
          postAuthor: 1,
          postType: 'wb_fn_desc',
          commentCount: 0,
          menuOrder: 0,
          postContent: postContent,
          postStatus: 'publish',
          postTitle: data.gene_id,
          postName: slug(data.gene_id),
          postParent: 0,
          pingStatus: 'open',
          commentStatus: 'open',
          guid: WpPosts.wpUrl + '/wb_fn_desc/' + slug(data.gene_id),
        };
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
        };
        return app.models.WpTerms.load.workflows.createTerms(postData, xrefData.taxTerms);
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

//TODO Move this RnaiWbXrefs.genTaxTerms
WpPosts.load.annotations.wormbase.fn_desc.genTaxTerms = function(where) {
  // where: {
  //   wbGeneAccession: data.gene_id
  // }
  // In the RNAI Ahringer library this is geneName
  // gene_id / wb_gene_accession
  // public_name / wb_gene_cgc_name
  // molecular_name / wb_gene_sequence_id

  return new Promise(function(resolve, reject) {
    app.models.RnaiWbXrefs.find(where)
      .then(function(results) {
        var taxTerms = [];
        results = JSON.stringify(results);
        results = JSON.parse(results);
        results.forEach(function(result) {
          Object.keys(result).map(function(key) {
            if (result[key]) {
              taxTerms.push({
                taxonomy: decamelize(key),
                taxTerm: result[key]
              });
            }
          });
        });
        resolve({
          xrefs: results,
          taxTerms: taxTerms
        });
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        reject(new Error(error));
      });
  });
};

WpPosts.load.annotations.wormbase.fn_desc.genPostContent = function(xrefData, data) {
  var proteinList = WpPosts.load.annotations.wormbase.fn_desc.termsToProteins(xrefData.xrefs);
  var contentObj = {
    data: data,
    taxTerms: xrefData.taxTerms,
    proteinList: proteinList,
  };
  return new Promise(function(resolve, reject) {
    var templateFile = path.join(path.dirname(__filename), 'templates/fn_desc.mustache');
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

WpPosts.load.annotations.wormbase.fn_desc.termsToProteins = function(xrefs) {
  var proteinList = [];
  xrefs.map(function(xref) {
    if (xref.wbTranscript && xref.wbProteinAccession) {
      proteinList.push({
        transcript: xref.wbTranscript,
        protein: xref.wbProteinAccession
      });
    } else if (xref.wbTranscript) {
      proteinList.push({
        transcript: xref.wbTranscript
      });
    } else if (xref.wbProteinAccession) {
      proteinList.push({
        protein: xref.wbProteinAccession
      });
    }
  });
  return proteinList;
};


//Will have to come back to this - it is tricky because each wbGeneSequenceId can have multiple transcripts
//For now we are just having an empty placeholder
WpPosts.load.annotations.wormbase.xrefs.genPostContent = function(contentData, data) {
  var contentObj = {
    contentData: contentData,
    data: data,
    wpUrl: WpPosts.wpUrl,
  };
  return new Promise(function(resolve, reject) {
    var templateFile = path.join(path.dirname(__filename), 'templates/xref.mustache');
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
