const mongoose = require('mongoose');
const { imageSchema } = require('./utils/commonSchemas');

const { Schema } = mongoose;

const itemReportSchema = new Schema(
  {
    reportType: {
      type: String,
      enum: ['lost', 'found'],
      required: [true, 'Report type is required.'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters.'],
      maxlength: [160, 'Title cannot exceed 160 characters.']
    },
    description: {
      type: String,
      required: [true, 'Description is required.'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters.'],
      maxlength: [4000, 'Description cannot exceed 4000 characters.']
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required.'],
      index: true
    },
    location: {
      type: Schema.Types.ObjectId,
      ref: 'CampusLocation',
      required: [true, 'Location is required.'],
      index: true
    },
    dateOccurred: {
      type: Date,
      required: [true, 'Date occurred is required.'],
      validate: {
        validator: (value) => value <= new Date(),
        message: 'Date occurred cannot be in the future.'
      },
      index: true
    },
    approximateTime: {
      type: String,
      trim: true,
      maxlength: [40, 'Approximate time cannot exceed 40 characters.']
    },
    currentHoldingLocation: {
      type: String,
      trim: true,
      maxlength: [200, 'Current holding location cannot exceed 200 characters.']
    },
    handlingNotes: {
      type: String,
      trim: true,
      maxlength: [1200, 'Handling notes cannot exceed 1200 characters.']
    },
    identifyingAttributes: {
      type: Map,
      of: {
        type: String,
        trim: true,
        maxlength: 300
      },
      default: {}
    },
    images: {
      type: [imageSchema],
      default: [],
      validate: {
        validator: (images) => images.length <= 5,
        message: 'A report can have at most 5 images.'
      }
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Report owner is required.'],
      index: true
    },
    status: {
      type: String,
      enum: [
        'draft',
        'published',
        'under_review',
        'matched',
        'claim_pending',
        'recovered',
        'closed',
        'rejected',
        'archived'
      ],
      default: 'draft',
      required: true,
      index: true
    },
    recoveredAt: {
      type: Date,
      default: null
    },
    recoveryClaimId: {
      type: Schema.Types.ObjectId,
      ref: 'RecoveryClaim',
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

itemReportSchema.index({ status: 1, reportType: 1, createdAt: -1 });
itemReportSchema.index({ category: 1, location: 1, dateOccurred: -1 });
itemReportSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.models.ItemReport || mongoose.model('ItemReport', itemReportSchema);

