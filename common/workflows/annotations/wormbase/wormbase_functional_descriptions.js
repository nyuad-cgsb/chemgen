'use strict';

const app = require('../../../../server/server');
const Promise = require('bluebird');
const Papa = require('papaparse');
const fs = require('fs');

// gene_id / wb_gene_accession
// public_name / wb_gene_cgc_name
// molecular_name / wb_gene_sequence_id
// concise_description
// provisional_description
// detailed_description
// automated_description
// gene_class_description

// Our Taxonomy Terms
// Gene ID: WBGene0000001
// Cosmid ID: aap-1
// SequenceID: Y110A7A.10

var file = '/home/jdr400/wormbase_ftp_resources/c_elegans.PRJNA13758.WS250.functional_descriptions.txt';
var inputStream = fs.createReadStream(file, 'utf8');

Papa.parse(inputStream, {
  header: true,
  delimiter: '\t',
  comments: '#',
  fastMode: false,
  worker: false,
  // preview: 100,
  chunk: function(results) {
    inputStream.pause();
    mapData(results.data)
      .then(function() {
        inputStream.resume();
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        inputStream.resume();
      });
    inputStream.resume();
  },
  complete: function() {
    console.log('All done!');
  },
});

function mapData(results) {
  return new Promise(function(resolve, reject) {
    Promise.map(results, function(data) {
        return app.models.WpPosts.load.annotations.wormbase.fn_desc.workflows.processData(data)
      }, {
        concurrency: 6
      })
      .then(function() {
        app.winston.info('finished chunk');
        resolve();
      })
      .catch(function(error) {
        app.winston.error(error.stack);
      });
  });
}
