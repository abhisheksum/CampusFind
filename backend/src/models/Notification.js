const mongoose = require('mongoose');

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification recipient is required.'],
      index: true
    },
    type: {
      type: String,
      enum: [
        'new_claim',
        'claim_status_changed',
        'new_message',
        'report_status_changed',
        'possible_match',
        'system'
      ],
      required: [true, 'Notification type is required.']
    },
    title: {
      type: String,
      required: [true, 'Notification title is required.'],
      trim: true,
      maxlength: [160, 'Notification title cannot exceed 160 characters.']
    },
    message: {
      type: String,
      required: [true, 'Notification message is required.'],
      trim: true,
      maxlength: [1000, 'Notification message cannot exceed 1000 characters.']
    },
    relatedEntityType: {
      type: String,
      enum: ['ItemReport', 'RecoveryClaim', 'Conversation', 'Message', 'User', 'System'],
      default: 'System'
    },
    relatedEntityId: {
      type: Schema.Types.ObjectId,
      default: null
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

module.exports =
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

