const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required.'],
      unique: true,
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters.'],
      maxlength: [80, 'Category name cannot exceed 80 characters.']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Category description cannot exceed 300 characters.']
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

categorySchema.index({ isActive: 1, name: 1 });

module.exports = mongoose.models.Category || mongoose.model('Category', categorySchema);

