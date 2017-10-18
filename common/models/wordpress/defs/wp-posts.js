'use strict';

module.exports = function(WpPosts) {
  WpPosts.load = {};
  WpPosts.load.assay = {};
  WpPosts.load.plate = {};
  WpPosts.load.plate.workflows = {};
  WpPosts.load.workflows = {};
  WpPosts.load.assay.workflows = {};
  WpPosts.load.annotations = {};
  WpPosts.load.annotations.wormbase = {};
  WpPosts.load.annotations.wormbase.xrefs = {};
  WpPosts.load.annotations.wormbase.xrefs.workflows = {};
  WpPosts.load.annotations.wormbase.fn_desc = {};
  WpPosts.load.annotations.wormbase.fn_desc.workflows = {};

  WpPosts.extract = {};
  WpPosts.extract.workflows = {};

  WpPosts.library = {};
  WpPosts.library.ahringer = {};
  WpPosts.library.ahringer.load = {};
  WpPosts.library.ahringer.load.plate = {};
  WpPosts.library.ahringer.load.assay = {};
  WpPosts.library.ahringer.load.workflows = {};
  WpPosts.library.ahringer.load.plate.workflows = {};
  WpPosts.library.ahringer.load.assay.workflows = {};

  WpPosts.library.chembridge = {};
  WpPosts.library.chembridge.load = {};
  WpPosts.library.chembridge.load.plate = {};
  WpPosts.library.chembridge.load.assay = {};
  WpPosts.library.chembridge.load.workflows = {};
  WpPosts.library.chembridge.load.plate.workflows = {};
  WpPosts.library.chembridge.load.assay.workflows = {};

  WpPosts.on('attached', function(obj) {
    require('../load/ExperimentAssay/wp-posts');
    require('../load/ExperimentAssayImage/wp-posts');
    require('../load/Experiment-Experimentplate/wp-posts');
    require('../load/wp-posts');
    require('../library/ahringer/wp-posts');
    require('../library/chembridge/wp-posts');
    require('../annotations/wormbase/wp-posts');
  });

  WpPosts.wpUrl = process.env.wpUrl || 'http://onyx.abudhabi.nyu.edu/wordpress';

};
