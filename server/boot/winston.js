'use strict';

module.exports = function(app, cb) {
  var winston = require('winston');
  winston.cli();

  var logger = new winston.Logger({
    transports: [
      new(winston.transports.Console)()
    ]
  });

  logger.cli();
  app.winston = winston;

  process.nextTick(cb);
};
