const mongoose = require('mongoose');
const { objectIdArray } = require('./utils/commonSchemas');

const { Schema } = mongoose;

const conversationSchema = new Schema(
  {
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'ItemReport',
      required: [true, 'Report is required.'],
      index: true
    },
    participantIds: {
      ...objectIdArray,
      validate: [
        {
          validator: (participants) => participants.length >= 2,
          message: 'A conversation requires at least two participants.'
        },
        objectIdArray.validate
      ]
    },
    lastMessageAt: {
      type: Date,
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
      required: true,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

conversationSchema.index({ reportId: 1, participantIds: 1 });

module.exports =
  mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

