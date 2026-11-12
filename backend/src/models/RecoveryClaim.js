const mongoose = require('mongoose');

const { Schema } = mongoose;
const activeClaimStatuses = ['submitted', 'under_review', 'more_information_required'];

const recoveryClaimSchema = new Schema(
  {
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'ItemReport',
      required: [true, 'Report is required.'],
      immutable: true,
      index: true
    },
    claimantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Claimant is required.'],
      immutable: true,
      index: true
    },
    message: {
      type: String,
      required: [true, 'Claim message is required.'],
      trim: true,
      minlength: [10, 'Claim message must be at least 10 characters.'],
      maxlength: [3000, 'Claim message cannot exceed 3000 characters.']
    },
    evidenceImages: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 2048
        }
      ],
      default: [],
      validate: {
        validator: (images) => images.length <= 5,
        message: 'A claim can have at most 5 evidence images.'
      }
    },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'more_information_required', 'accepted', 'rejected'],
      default: 'submitted',
      required: true,
      index: true
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    decisionReason: {
      type: String,
      trim: true,
      maxlength: [2000, 'Decision reason cannot exceed 2000 characters.']
    },
    reviewNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Review notes cannot exceed 2000 characters.']
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

recoveryClaimSchema.index(
  { reportId: 1, claimantId: 1 },
  {
    unique: true,
    name: 'unique_active_claim_per_report_and_claimant',
    partialFilterExpression: { status: { $in: activeClaimStatuses } }
  }
);
recoveryClaimSchema.index({ claimantId: 1, createdAt: -1 });

recoveryClaimSchema.pre('validate', async function validateClaim() {
  if (!this.reportId || !this.claimantId) return;

  const ItemReport = mongoose.model('ItemReport');
  const report = await ItemReport.findById(this.reportId).select('ownerId').lean();

  if (!report) {
    this.invalidate('reportId', 'The item report does not exist.');
    return;
  }

  if (report.ownerId.equals(this.claimantId)) {
    this.invalidate('claimantId', 'Users cannot claim their own reports.');
  }
});

module.exports =
  mongoose.models.RecoveryClaim || mongoose.model('RecoveryClaim', recoveryClaimSchema);

