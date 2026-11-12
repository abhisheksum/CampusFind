const mongoose = require('mongoose');

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Audit actor is required.'],
      index: true
    },
    action: {
      type: String,
      required: [true, 'Audit action is required.'],
      trim: true,
      maxlength: [120, 'Audit action cannot exceed 120 characters.']
    },
    entityType: {
      type: String,
      required: [true, 'Audit entity type is required.'],
      trim: true,
      maxlength: [80, 'Audit entity type cannot exceed 80 characters.']
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Audit entity ID is required.'],
      index: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

