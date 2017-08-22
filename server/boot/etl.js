'use strict';

module.exports = function(app, cb) {
  /*
   * These are just some general helpers for workflows - rows, columns, transforming object to find
   */

  app.etlWorkflow = {};
  app.etlWorkflow.helpers = {};

  app.etlWorkflow.helpers.findOrCreateObj = function(data) {
    var andArray = [];
    for (var k in data) {
      if (data.hasOwnProperty(k)) {
        var newObj = {};
        newObj[k] = data[k];
        andArray.push(newObj);
      }
    }

    return {
      and: andArray,
    };
  };

  var listWells = function() {
    var rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    var cols = ['01', '02', '03', '04', '05',
      '06', '07', '08', '09', '10', '11', '12',
    ];
    var allVals = [];

    rows.map(function(row) {
      cols.map(function(col) {
        allVals.push(row + col);
      });
    });

    return allVals;
  };

  app.etlWorkflow.helpers.all96Wells = listWells();

  app.etlWorkflow.helpers.list96Wells = function() {
    var rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    var cols = ['01', '02', '03', '04', '05',
      '06', '07', '08', '09', '10', '11', '12',
    ];
    var allVals = [];

    rows.map(function(row) {
      cols.map(function(col) {
        allVals.push(row + col);
      });
    });

    return allVals;
  };

  app.etlWorkflow.helpers.rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  app.etlWorkflow.helpers.cols = ['01', '02', '03', '04', '05', '06',
    '07', '08', '09', '10', '11', '12',
  ];

  process.nextTick(cb); // Remove if you pass `cb` to an async function yourself
};
