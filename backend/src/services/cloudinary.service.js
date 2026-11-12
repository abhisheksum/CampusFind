const cloudinary = require('cloudinary').v2;
const config = require('../config/env');
const AppError = require('../utils/errors');

const isConfigured = Boolean(
  config.cloudinary.cloudName &&
    config.cloudinary.apiKey &&
    config.cloudinary.apiSecret
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true
  });
}

function assertConfigured() {
  if (!isConfigured) {
    throw new AppError(
      'Image storage is not configured.',
      503,
      'IMAGE_STORAGE_UNAVAILABLE'
    );
  }
}

function createUploadSignature() {
  assertConfigured();
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = {
    folder: config.cloudinary.folder,
    timestamp
  };

  return {
    timestamp,
    signature: cloudinary.utils.api_sign_request(
      paramsToSign,
      config.cloudinary.apiSecret
    ),
    cloudName: config.cloudinary.cloudName,
    apiKey: config.cloudinary.apiKey,
    folder: config.cloudinary.folder
  };
}

async function deleteImage(publicId) {
  if (!publicId || !isConfigured) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

async function deleteImages(images = []) {
  await Promise.all(images.map((image) => deleteImage(image.publicId)));
}

module.exports = {
  createUploadSignature,
  deleteImage,
  deleteImages
};

