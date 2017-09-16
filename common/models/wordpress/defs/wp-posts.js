'use strict';

module.exports = function(WpPosts) {
  WpPosts.load = {};
  WpPosts.load.assay = {};
  WpPosts.load.plate = {};
  WpPosts.load.workflows = {};

  WpPosts.extract = {};
  WpPosts.extract.workflows = {};

  WpPosts.library = {};
  WpPosts.library.ahringer = {};
  WpPosts.library.ahringer.load = {};
  WpPosts.library.ahringer.load = {};
  WpPosts.library.ahringer.load.plate = {};
  WpPosts.library.ahringer.load.assay = {};
  WpPosts.library.ahringer.load.workflows = {};
  WpPosts.library.ahringer.load.plate.workflows = {};
  WpPosts.library.ahringer.load.assay.workflows = {};

  WpPosts.on('attached', function(obj) {
    require('../library/ahringer/ExperimentAssay/wp-posts');
    require('../library/ahringer/Experiment-Experimentplate/wp-posts');
    require('../load/wp-posts');
  });

  WpPosts.wpUrl = process.env.wpUrl || 'http://onyx.abudhabi.nyu.edu/wordpress';

};
