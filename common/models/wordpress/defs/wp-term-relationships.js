'use strict';

module.exports = function(WpTermRelationships) {
  WpTermRelationships.load = {};
  WpTermRelationships.load.workflows = {};

  WpTermRelationships.extract = {};
  WpTermRelationships.extract.workflows = {};

  WpTermRelationships.on('attached', function(obj) {
    require('../load/wp-term-relationships');
  });

};
