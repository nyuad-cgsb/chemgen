'use strict';

const app = require('../../../../server/server.js');
const ExperimentAssay = app.models.ExperimentAssay;
const Promise = require('bluebird');
const readFile = Promise.promisify(require('fs').readFile);
const Mustache = require('mustache');
const path = require('path');

ExperimentAssay.helpers.getImagePath = function(plateInfo, well) {
  var imageArray = plateInfo.ExperimentExperimentplate.imagePath.split('\\');
  var folder = imageArray[4];
  var imageId = imageArray[5];
  var plateId = plateInfo.ExperimentExperimentplate.instrumentPlateId;
  var assayName = plateInfo.ExperimentExperimentplate.barcode + '_' + well;

  var autoLevelJpegImage = ['/',
    folder, '/',
    plateId, '/',
    assayName,
    '-autolevel.jpeg'
  ].join('');

  return [autoLevelJpegImage, folder, imageId, plateId];
};

/**

This was genImageMeta

This function is very site specific - I take the full path the images, which
begins with /mnt/Plate_Data

**/
ExperimentAssay.helpers.genImageFileNames = function(plateInfo, well) {
  var imageArray = plateInfo.ExperimentExperimentplate.imagePath.split('\\');
  var folder = imageArray[4];
  var imageId = imageArray[5];
  var plateId = plateInfo.ExperimentExperimentplate.instrumentPlateId;
  var assayName = plateInfo.ExperimentExperimentplate.barcode + '_' + well;

  var imagePath = [
    '/mnt/Plate_Data/',
    folder, '/',
    imageId, '/',
    imageId
  ].join('');

  var ext = 'f00d0.C01';
  var vendorImage = imagePath + '_' + well + ext;
  var outDir = '/mnt/image/';
  var makeDir = outDir + folder + '/' + plateId;
  var baseImage = makeDir + '/' + assayName;
  var autoLevelJpegImage = baseImage + '-autolevel.jpeg';

  var random = Math.random().toString(36).substring(7);
  var tmpImage = '/tmp/' + random + '/' + random + '.C01';

  var images = {
    convertImage: baseImage + '.tiff',
    convertBmp: baseImage + '.bmp',
    autoLevelTiffImage: autoLevelJpegImage,
    autoLevelJpegImage: baseImage + '-autolevel.jpeg',
    vendorImage: vendorImage,
    makeDir: makeDir,
    baseImage: baseImage,
    assayName: assayName,
    plateId: plateId,
    random: random,
    tmpImage: tmpImage,
    thumbSizes: [
      '1024x1024',
      '1080x1080',
      '1080x675',
      '150x150',
      '300x300',
      '400x250',
      '400x284',
      '510x384',
      '600x600',
      '768x768',
    ],
  };

  return images;
};

ExperimentAssay.helpers.genConvertImageCommands = function(images) {
  var templateFile = path.join(path.dirname(__filename), 'templates/convertCommands.mustache');

  return new Promise(function(resolve, reject) {
    readFile(templateFile, 'utf8')
      .then(function(contents) {
        var commands = Mustache.render(contents, {
          random: images.random,
          thumbSizes: images.thumbSizes,
          images: images
        });
        resolve(commands);
      })
      .catch(function(error) {
        app.winston.error(error.stack);
        reject(new Error(error));
      });
  });
};
