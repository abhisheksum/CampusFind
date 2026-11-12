function normalizeReportImages(images = []) {
  return images.map((image) => ({
    url: image.url,
    publicId: image.publicId || undefined,
    altText: image.altText || undefined
  }));
}

function serializeReport(report) {
  const identifyingAttributes = report.identifyingAttributes instanceof Map
    ? Object.fromEntries(report.identifyingAttributes)
    : report.identifyingAttributes || {};

  return {
    id: report._id.toString(),
    reportType: report.reportType,
    title: report.title,
    description: report.description,
    category: report.category,
    location: report.location,
    dateOccurred: report.dateOccurred,
    approximateTime: report.approximateTime || null,
    currentHoldingLocation: report.currentHoldingLocation || null,
    handlingNotes: report.handlingNotes || null,
    identifyingAttributes,
    images: normalizeReportImages(report.images),
    ownerId: report.ownerId,
    status: report.status,
    recoveredAt: report.recoveredAt || null,
    recoveryClaimId: report.recoveryClaimId?.toString?.() || report.recoveryClaimId || null,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt
  };
}

module.exports = { serializeReport, normalizeReportImages };

