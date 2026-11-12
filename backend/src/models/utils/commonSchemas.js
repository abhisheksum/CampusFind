const mongoose = require('mongoose');

const { Schema } = mongoose;

const imageSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048
    },
    publicId: {
      type: String,
      trim: true,
      maxlength: 255
    },
    altText: {
      type: String,
      trim: true,
      maxlength: 160
    }
  },
  { _id: false }
);

const objectIdArray = {
  type: [Schema.Types.ObjectId],
  default: [],
  validate: {
    validator: (values) => new Set(values.map((value) => value.toString())).size === values.length,
    message: 'Duplicate references are not allowed.'
  }
};

module.exports = {
  imageSchema,
  objectIdArray
};

