function normalizeClaimImages(images = []) {
  return images.map((image) => image.trim());
}

function serializeClaim(claim) {
  const report = claim.reportId && typeof claim.reportId === 'object'
    ? claim.reportId
    : claim.reportId;
  const claimant = claim.claimantId && typeof claim.claimantId === 'object'
    ? claim.claimantId
    : claim.claimantId;
  const reviewedBy = claim.reviewedBy && typeof claim.reviewedBy === 'object'
    ? claim.reviewedBy
    : claim.reviewedBy;

  return {
    id: claim._id.toString(),
    reportId: report?._id?.toString() || report?.toString(),
    claimantId: claimant?._id?.toString() || claimant?.toString(),
    claimant: claimant && typeof claimant === 'object'
      ? { id: claimant._id.toString(), name: claimant.name, avatarUrl: claimant.avatarUrl || null }
      : undefined,
    report: report && typeof report === 'object'
      ? {
          id: report._id.toString(),
          title: report.title,
          reportType: report.reportType,
          status: report.status,
          images: report.images || [],
          ownerId: report.ownerId?.toString?.() || report.ownerId
        }
      : undefined,
    message: claim.message,
    evidenceImages: claim.evidenceImages || [],
    status: claim.status,
    reviewedBy: reviewedBy && typeof reviewedBy === 'object'
      ? { id: reviewedBy._id.toString(), name: reviewedBy.name }
      : reviewedBy?.toString?.() || null,
    reviewedAt: claim.reviewedAt || null,
    decisionReason: claim.decisionReason || claim.reviewNotes || null,
    reviewNotes: claim.reviewNotes || null,
    createdAt: claim.createdAt,
    updatedAt: claim.updatedAt
  };
}

module.exports = { normalizeClaimImages, serializeClaim };
