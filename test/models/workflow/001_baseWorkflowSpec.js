'use strict';

const path = require('path');
const expect = require('chai')
  .expect;
const assert = require('assert');
const Promise = require('bluebird');
const app = require(path.resolve(__dirname) + '/../../../server/server');
const util = require('util');
const diff = require('deep-diff').diff;

describe('001_baseWorkflowSpec', function() {
  it('Should create a workflow object', function(done) {
    var create = {
      tasks: ['task1', 'task2', 'task3'],
      library: 'ahringer',
      libraryModel: 'RnaiLibrary',
      libraryStockModel: 'RnaiLibrarystock',
      condition: 'Permissive',
      assayDate: '2017-12-11',
      imageDates: ['2017-01-16', '2017-01-17'],
      wells: app.etlWorkflow.helpers.list96Wells(),
      screenStage: 'Primary',
      permissiveTemp: 30,
      restrictiveTemp: 30,
      instrumentId: 1,
      isJunk: 0,
      screenName: '2017-12-11--PR',
      search: {},
      data: {},
    };

    app.models.Workflow.create(create)
      .then(function(results) {
        var jsonResults = JSON.parse(JSON.stringify(results));
        create.id = 1;
        expect(jsonResults)
          .to.deep.equal(create);
        done();
      })
      .catch(function(error) {
        done(new Error(error));
      });
  });
});
