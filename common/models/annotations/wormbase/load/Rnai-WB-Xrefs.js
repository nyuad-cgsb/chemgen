'use strict';

const app = require('../../../../../server/server');
const Promise = require('bluebird');

const RnaiWbXrefs = app.models.RnaiWbXrefs;

RnaiWbXrefs.load.workflows.parseLine = function(data) {
  return new Promise(function(resolve, reject) {
    var contentData = RnaiWbXrefs.load.createTerms(data);
    RnaiWbXrefs
          .findOrCreate({
            where: app.etlWorkflow.helpers.findOrCreateObj(contentData),
          }, contentData)
          .then(function(results) {
            resolve(contentData);
          })
          .catch(function(error) {
            // app.winston.info(error.stack);
            reject(new Error(error));
          });
  });
};

RnaiWbXrefs.load.createTerms = function(data) {
  var contentData = {};
  if (checkTermKey(data[0])) {
    contentData.wbGeneSequenceId = data[0];
  }
  if (checkTermKey(data[1])) {
    contentData.wbGeneAccession = data[1];
  }
  if (checkTermKey(data[2])) {
    contentData.wbGeneCgcName = data[2];
  }
  if (checkTermKey(data[3])) {
    contentData.wbTranscript = data[3];
  }
  if (checkTermKey(data[4])) {
    contentData.wbProteinAccession = data[4];
  }
  if (checkTermKey(data[5])) {
    contentData.insdcParentSeq = data[5];
  }
  if (checkTermKey(data[6])) {
    contentData.insdcLocusTag = data[6];
  }
  if (checkTermKey(data[7])) {
    contentData.insdcProteinId = data[7];
  }
  if (checkTermKey(data[8])) {
    contentData.uniprotAccession = data[8];
  }

  return contentData;
};

function checkTermKey(termKey) {
  var re = new RegExp('^\.$');
  if (re.test(termKey)) {
    return false;
  }  else if (typeof termKey !== 'undefined' || termKey !== null) {
    return true;
  } else {
    return false;
  }
}
