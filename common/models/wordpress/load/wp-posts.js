'use strict';

const app = require('../../../../server/server');
const WpPosts = app.models.WpPosts;
const Promise = require('bluebird');
const slug = require('slug');
const php = require('js-php-serialize');
const deepcopy = require('deepcopy');
const Mustache = require('mustache');
const readFile = Promise.promisify(require('fs').readFile);
const path = require('path');

WpPosts.load.postInfo = function(workflowData, plateInfo) {
  var postContent = '';
  var library = capitalizeFirstLetter(workflowData.library);

  postContent = postContent +
    '<b>Screen Name: </b>' + workflowData.screenName + '<br>';
  postContent = postContent + '<b>Library: </b>' + library + '<br>';
  postContent = postContent + '<b>Screen Stage: </b>' +
    workflowData.screenStage + '<br>';
  postContent = postContent + '<b>Imaging Dates: </b> ' + plateInfo.vendorPlate.creationdate + '<br>';

  postContent = postContent + '<b>Junk: </b>' + workflowData.isJunk + '<br>';

  return postContent;
};

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// TODO Should these be in terms?
// This gets called for both the plate and assay
WpPosts.load.createTags = function(workflowData, plateInfo) {
  var tags = [{
    taxonomy: 'screen_name',
    taxTerm: workflowData.screenName || 'test',
  }, {
    taxonomy: 'barcode',
    taxTerm: plateInfo.ExperimentExperimentplate.barcode,
  }, {
    taxonomy: 'envira-tag',
    taxTerm: plateInfo.ExperimentExperimentplate.barcode,
  }, {
    taxonomy: 'screen_stage',
    taxTerm: workflowData.screenStage,
  }, {
    taxonomy: 'junk',
    taxTerm: workflowData.isJunk,
  }];
  tags = WpPosts['library'][workflowData.library]['load']['createTags'](workflowData, tags, plateInfo);
  tags = filterTags(tags);

  return tags;
};

// TODO This should just be a part of a template
WpPosts.load.genTermTable = function(createTerms) {
  var table = '';
  var seen = {};
  createTerms.map(function(createTerm) {
    if (createTerm.taxonomy.match('envira')) {
      return;
    } else if (!createTerm.taxTerm) {
      return;
    } else if (seen.hasOwnProperty(createTerm.taxTerm)) {
      return;
    }
    seen[createTerm.taxTerm] = 1;
    table = table + '<tr>';
    var taxTerm = createTerm.taxTerm;
    var taxTermUrl = '<a href="' + WpPosts.wpUrl + '/' + createTerm.taxonomy + '/' +
      slug(taxTerm) + '/">' + taxTerm + '</a>';

    table = table + '<td><b>';
    table = table + createTerm.taxonomy.replace(/\b\w/g, function(l) {
      return l.toUpperCase();
    });
    table = table + '</b></td><td>' + taxTermUrl + '</td>';
    table = table + '</tr>';
  });
  return table;
};

var filterTags = function(tags) {
  var cleanTags = [];

  tags.map(function(tag) {
    if (tag.taxTerm) {
      cleanTags.push(tag);
    }
  });

  return cleanTags;
};

// Create the tags for the assay
WpPosts.load.assay.genTags = function(workflowData, plateData, libraryData) {
  var well = libraryData.libraryStock.well;
  var barcode = plateData.ExperimentExperimentplate.barcode;

  var createTermObjs = WpPosts.load.createTags(workflowData, plateData);

  var longWell = barcode + '_' + well;
  createTermObjs.push({
    taxonomy: 'long_well',
    taxTerm: longWell,
  });
  createTermObjs.push({
    taxonomy: 'envira-tag',
    taxTerm: longWell,
  });

  createLibrarystockResult.taxTerms.map(function(createTerm) {
    createTermObjs.push(createTerm);
    createTermObjs.push({
      taxonomy: 'envira-tag',
      taxTerm: createTerm.taxTerm,
    });
  });

  return createTermObjs;
};

/**
This is very theme dependent and should probably be in a configuration somewhere
For now we are using the 'shapely' theme
https://colorlib.com/wp/themes/shapely/
These sizes need to be generated by imageMagick
//TODO Should this be in Post Meta?
**/
WpPosts.load.genImageMeta = function(imageBase) {
  // var imageSizes = ['150x150', '300x300', '768x768', '1024x1024', '1024x1024', '1110x530', '730x350', '350x300'];
  var imageSplit = imageBase.split('/');
  var imageName = imageSplit.pop();
  var imageMetaObj = {
    width: 1600,
    height: 1600,
    file: imageBase + '.jpeg',
    sizes: {
      thumbnail: {
        file: imageName + '-150x150.jpeg',
        width: 150,
        height: 150,
        'mime-type': 'image/jpeg',
      },
      medium: {
        file: imageName + '-300x300.jpeg',
        width: 300,
        height: 300,
        'mime-type': 'image/jpeg',
      },
      medium_large: {
        file: imageName + '-600x600.jpeg',
        width: 600,
        height: 600,
        'mime-type': 'image/jpeg',
      },
      large: {
        file: imageName + '-1024x1024.jpeg',
        width: 1024,
        height: 1024,
        'mime-type': 'image/jpeg',
      },
      'original': {
        file: imageName + '.jpeg',
        width: 1600,
        height: 1600,
        'mime-type': 'image/jpeg',
      },
      'shapely-full': {
        file: imageName + '-1024x1024.jpeg',
        width: 1024,
        height: 1024,
        'mime-type': 'image/jpeg',
      },
      'shapely-featured': {
        file: imageName + '-768x768.jpeg',
        width: 768,
        height: 768,
        'mime-type': 'image/jpeg',
      },
      'shapely-grid': {
        file: imageName + '-300x300.jpeg',
        width: 300,
        height: 300,
        'mime-type': 'image/jpeg',
      },
    },
    image_meta: {
      aperture: '0',
      credit: '',
      camera: '',
      caption: '',
      created_timestamp: '0',
      copyright: '',
      focal_length: '0',
      iso: '0',
      shutter_speed: '0',
      title: '',
      orientation: '0',
      keywords: {},
    },
  };

  var s = php.serialize(imageMetaObj);
  return s;
};
