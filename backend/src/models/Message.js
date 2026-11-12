const mongoose = require('mongoose');
const { imageSchema } = require('./utils/commonSchemas');

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation is required.'],
      index: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required.'],
      index: true
    },
    body: {
      type: String,
      required: [true, 'Message body is required.'],
      trim: true,
      minlength: [1, 'Message cannot be empty.'],
      maxlength: [4000, 'Message cannot exceed 4000 characters.']
    },
    attachments: {
      type: [imageSchema],
      default: [],
      validate: {
        validator: (attachments) => attachments.length <= 5,
        message: 'A message can have at most 5 attachments.'
      }
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

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ senderId: 1, isRead: 1 });

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);

