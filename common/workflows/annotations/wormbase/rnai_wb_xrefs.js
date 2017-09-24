'use strict';

// Our Taxonomy Terms
// Gene ID: WBGene0000001
// Cosmid ID: aap-1
// SequenceID: Y110A7A.10

// 1. Wormbase Gene Sequence Name - 2L52.1 (public_name)
// 2. WormBase Gene Accession - WBGene0000001 (gene_id)
//         URL - http://www.wormbase.org/species/c_elegans/gene/WBGene00007063
// 3. WormBase Gene CGC name  - aap-1
// 4. WormBase Transcript sequence Name - 2L252.1b
//         URL - http://www.wormbase.org/species/c_elegans/transcript/2L52.1a
// 5. WormPep protein Accession - CE50559
//         URL - http://www.wormbase.org/species/c_elegans/protein/WP:CE50559
// 6. INSDC parent sequence name - BX284602
// 7. INSDC locus_tag id - CELE*
// 8. INSDC protein_id - CTQ*
// 9. UniProt Accession - A4F336

const app = require('../../../../server/server');
const Promise = require('bluebird');
const Papa = require('papaparse');
const fs = require('fs');

var file = '/home/jdr400/wormbase_ftp_resources/c_elegans.PRJNA13758.WS250.xrefs.txt';

var inputStream = fs.createReadStream(file, 'utf8');

Papa.parse(inputStream, {
  header: false,
  comments: '//',
  delimiter: '\t',
  fastMode: false,
  worker: true,
  // preview: 1000,
  step: function(results) {
    inputStream.pause();
    app.winston.info(JSON.stringify(results[0]));
    app.models.RnaiWbXrefs.load.workflows
    .parseLine(results.data[0])
    .then(function(results) {
      return inputStream.resume();
    })
    .catch(function(error) {
      app.winston.error(error.stack);
      return inputStream.resume();
    });
    inputStream.resume();
  },
  complete: function() {
    console.log('All done!');
  },
});
