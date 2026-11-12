const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters.'],
      maxlength: [100, 'Name cannot exceed 100 characters.']
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address.']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required.'],
      select: false
    },
    studentId: {
      type: String,
      required: [true, 'Student ID is required.'],
      unique: true,
      trim: true,
      minlength: [2, 'Student ID must be at least 2 characters.'],
      maxlength: [50, 'Student ID cannot exceed 50 characters.']
    },
    department: {
      type: String,
      required: [true, 'Department is required.'],
      trim: true,
      maxlength: [120, 'Department cannot exceed 120 characters.']
    },
    role: {
      type: String,
      enum: ['student', 'moderator', 'admin'],
      default: 'student',
      required: true
    },
    avatarUrl: {
      type: String,
      trim: true,
      maxlength: 2048
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    refreshTokenHash: {
      type: String,
      select: false,
      default: null
    },
    refreshTokenVersion: {
      type: Number,
      default: 0,
      select: false
    },
    authVersion: {
      type: Number,
      default: 0,
      select: false
    },
    emailVerificationTokenHash: {
      type: String,
      select: false,
      default: null
    },
    emailVerificationExpiresAt: {
      type: Date,
      select: false,
      default: null
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
      default: null
    },
    passwordResetExpiresAt: {
      type: Date,
      select: false,
      default: null
    },
    passwordChangedAt: {
      type: Date,
      select: false,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

userSchema.index({ isActive: 1, role: 1 });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);

