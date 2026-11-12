const mongoose = require('mongoose');

const campusLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required.'],
      trim: true,
      maxlength: [120, 'Location name cannot exceed 120 characters.']
    },
    building: {
      type: String,
      required: [true, 'Building is required.'],
      trim: true,
      maxlength: [120, 'Building cannot exceed 120 characters.']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Location description cannot exceed 300 characters.']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

campusLocationSchema.index({ isActive: 1, building: 1, name: 1 });

module.exports =
  mongoose.models.CampusLocation || mongoose.model('CampusLocation', campusLocationSchema);

