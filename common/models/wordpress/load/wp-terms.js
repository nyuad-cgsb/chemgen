'use strict';

const app = require('../../../../server/server');
const WpTerms = app.models.WpTerms;
const Promise = require('bluebird');
const slug = require('slug');

WpTerms.load.workflows.createTerms = function(postData, createTermObjs) {
  return new Promise(function(resolve, reject) {
    Promise.map(createTermObjs, function(createTermObj) {
        return WpTerms.load.createTerm(postData['id'], createTermObj);
      }, {
        concurrency: 1
      })
      .then(function(results) {
        return app.models.WpTermTaxonomy.load.workflows.processTaxTerms(postData, results);
      })
      .then(function(results) {
        resolve(postData);
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        reject(new Error(error));
      });
  });
};

WpTerms.load.createTerm = function(postId, createTermObj) {
  var createTerm = {
    name: createTermObj.taxTerm,
    slug: slug(createTermObj.taxTerm) || '',
    termGroup: 0,
  };

  return new Promise(function(resolve, reject) {
    WpTerms
      .findOrCreate({
        where: app.etlWorkflow.helpers.findOrCreateObj(createTerm),
      }, createTerm)
      .then(function(results) {
        var wanted = prepareTaxTerm(results[0], createTermObj, postId);
        resolve(wanted);
      })
      .catch(function(error) {
        // If its a duplicate error just find it and return
        app.winston.info(JSON.stringify(error));
        if (error.message.match('Duplicate') || error.message.match('duplicate')) {
          WpTerms
            .findOne({
              where: app.etlWorkflow.helpers.findOrCreateObj(createTerm),
            })
            .then(function(results) {
              var wanted = prepareTaxTerm(results, createTerm, postId);
              resolve(wanted);
            }).catch(function(error) {
              reject(new Error(error));
            });
        } else if (!error.hasOwnProperty('code')) {
          reject(new Error(error));
        } else if (error.code.match('ER_DUP_ENTRY')) {
          WpTerms
            .findOne({
              where: app.etlWorkflow.helpers.findOrCreateObj(createTerm),
            })
            .then(function(results) {
              var wanted = prepareTaxTerm(results, createTerm, postId);
              resolve(wanted);
            }).catch(function(error) {
              reject(new Error(error));
            });
        } else {
          reject(new Error(error));
        }
      });
  });
};

WpTerms.load.genLibraryTerms = function(workflowData, plateInfo, libraryResult, condition, strain, well, taxID) {
  var plateId = plateInfo.ExperimentExperimentplate.experimentPlateId;
  var barcode = plateInfo.ExperimentExperimentplate.barcode;

  var taxTerms = [{
      taxonomy: 'image_date',
      taxTerm: plateInfo.ExperimentExperimentplate.plateStartTime,
    }, {
      taxonomy: 'condition',
      taxTerm: condition,
    }, {
      taxonomy: 'envira-tag',
      taxTerm: [workflowData.screenName, '_', condition,
        '_', strain, '_', libraryResult[taxID],
      ].join(''),
    }, {
      taxonomy: 'envira-tag',
      taxTerm: workflowData.screenName + '_' + barcode,
    }, {
      taxonomy: 'envira-tag',
      taxTerm: workflowData.screenName + '_ID_' + plateId + '_' + barcode,
    }, {
      taxonomy: 'envira-tag',
      taxTerm: [workflowData.screenName, '_', barcode, '_', condition,
        '_', strain, '_', libraryResult[taxID],
      ].join(''),
    }, {
      taxonomy: 'envira-tag',
      taxTerm: [workflowData.screenName, '_', condition,
        '_', strain, '_', well,
      ].join(''),
    },
    //These last two are for building the control gallery
    //For the secondary screen the L4440s are in the same plate
    {
      taxonomy: 'envira-tag',
      taxTerm: workflowData.screenName + '_ID_' + plateId + '_' + libraryResult[taxID],
    },
    //For the primary screen there is 1 whole plate per condition
    {
      taxonomy: 'envira-tag',
      taxTerm: workflowData.screenName + '_' + condition + '_' + libraryResult[taxID],
    },
    {
      taxonomy: 'screen_name',
      taxTerm: workflowData.screenName,
    },
    //This last one is only for worms...
    {
      taxonomy: 'worm_strain',
      taxTerm: strain,
    }
  ];

  return taxTerms;
};

function prepareTaxTerm(wanted, createTermObj, postId) {
  wanted.postId = postId;
  wanted.taxonomy = createTermObj.taxonomy;
  wanted.term = createTermObj.taxTerm;

  return wanted;
}
