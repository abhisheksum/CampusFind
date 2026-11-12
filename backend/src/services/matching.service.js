const mongoose = require('mongoose');
const config = require('../config/env');
const AppError = require('../utils/errors');
const { ItemReport } = require('../models');

const excludedStatuses = new Set(['recovered', 'closed', 'rejected', 'archived']);
const activeStatuses = { $nin: [...excludedStatuses, 'draft'] };
const attributeKeys = ['color', 'brand', 'model'];

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value) {
  return new Set(normalize(value).split(' ').filter((token) => token.length > 1));
}

function textSimilarity(left, right) {
  const leftText = normalize(left);
  const rightText = normalize(right);
  if (!leftText || !rightText) return 0;
  if (leftText === rightText || leftText.includes(rightText) || rightText.includes(leftText)) return 1;

  const leftTokens = tokens(leftText);
  const rightTokens = tokens(rightText);
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union ? intersection / union : 0;
}

function sameReference(left, right) {
  return left && right && left.toString() === right.toString();
}

function dateSimilarity(left, right) {
  if (!left || !right) return 0;
  const days = Math.abs(new Date(left).getTime() - new Date(right).getTime()) / 86400000;
  return Math.max(0, 1 - (days / config.matching.dateWindowDays));
}

function attributeMatches(left = {}, right = {}) {
  return attributeKeys.filter((key) => {
    const first = normalize(left instanceof Map ? left.get(key) : left[key]);
    const second = normalize(right instanceof Map ? right.get(key) : right[key]);
    return first && second && (first === second || textSimilarity(first, second) >= 0.8);
  });
}

function calculateMatch(source, candidate) {
  const weights = config.matching.weights;
  const reasons = [];
  let score = 0;

  if (sameReference(source.category?._id || source.category, candidate.category?._id || candidate.category)) {
    score += weights.category;
    reasons.push('Same category');
  }

  const nameSimilarity = textSimilarity(source.title, candidate.title);
  score += weights.name * nameSimilarity;
  if (nameSimilarity >= 0.85) reasons.push('Very similar item name');
  else if (nameSimilarity >= 0.45) reasons.push('Related item name');

  const descriptionSimilarity = textSimilarity(source.description, candidate.description);
  score += weights.description * descriptionSimilarity;
  if (descriptionSimilarity >= 0.35) reasons.push('Similar descriptions');

  if (sameReference(source.location?._id || source.location, candidate.location?._id || candidate.location)) {
    score += weights.location;
    reasons.push('Same campus location');
  }

  const dateScore = dateSimilarity(source.dateOccurred, candidate.dateOccurred);
  score += weights.date * dateScore;
  if (dateScore >= 0.75) reasons.push('Dates are close');

  const matchedAttributes = attributeMatches(source.identifyingAttributes, candidate.identifyingAttributes);
  if (matchedAttributes.length) {
    score += weights.attributes * (matchedAttributes.length / attributeKeys.length);
    reasons.push(`Matching ${matchedAttributes.join(', ')}`);
  }

  return {
    score: Math.min(100, Math.round(score)),
    reasons
  };
}

function assertReportId(reportId) {
  if (!mongoose.isValidObjectId(reportId)) {
    throw new AppError('Invalid report ID.', 400, 'INVALID_IDENTIFIER');
  }
}

function canViewReport(report, user) {
  if (!report) return false;
  if (report.ownerId && report.ownerId.toString() === user._id.toString()) return true;
  return !excludedStatuses.has(report.status) && report.status !== 'draft';
}

async function findReport(reportId, user) {
  assertReportId(reportId);
  const report = await ItemReport.findById(reportId)
    .populate('category', 'name description')
    .populate('location', 'name building description')
    .lean();
  if (!report || !canViewReport(report, user) || report.status === 'draft') {
    throw new AppError('Report not found.', 404, 'REPORT_NOT_FOUND');
  }
  return report;
}

async function findMatchesForReport(source, limit, excludeOwner = false) {
  const oppositeType = source.reportType === 'lost' ? 'found' : 'lost';
  const query = {
    _id: { $ne: source._id },
    reportType: oppositeType,
    status: activeStatuses
  };
  if (excludeOwner) query.ownerId = { $ne: source.ownerId };

  const candidates = await ItemReport.find(query)
    .populate('category', 'name description')
    .populate('location', 'name building description')
    .sort({ createdAt: -1 })
    .lean();

  return candidates
    .map((candidate) => ({ candidate, ...calculateMatch(source, candidate) }))
    .filter(({ score }) => score >= config.matching.minimumScore)
    .sort((left, right) => right.score - left.score || right.candidate.createdAt - left.candidate.createdAt)
    .slice(0, limit);
}

function serializeMatch(candidate, score, reasons) {
  return {
    reportId: candidate._id.toString(),
    itemName: candidate.title,
    itemImage: candidate.images?.[0]?.url || null,
    category: candidate.category,
    location: candidate.location,
    matchPercentage: score,
    matchingReasons: reasons
  };
}

async function getMatchesForReport(reportId, user, requestedLimit) {
  const source = await findReport(reportId, user);
  const limit = Math.min(
    Math.max(Number(requestedLimit) || config.matching.defaultLimit, 1),
    config.matching.maxLimit
  );
  const matches = await findMatchesForReport(source, limit);
  return matches.map(({ candidate, score, reasons }) => serializeMatch(candidate, score, reasons));
}

async function getMatchesForUser(user, requestedLimit) {
  const limit = Math.min(
    Math.max(Number(requestedLimit) || config.matching.defaultLimit, 1),
    config.matching.maxLimit
  );
  const reports = await ItemReport.find({
    ownerId: user._id,
    status: activeStatuses
  })
    .sort({ createdAt: -1 })
    .lean();

  const uniqueMatches = new Map();
  for (const report of reports) {
    const matches = await findMatchesForReport(report, config.matching.maxLimit, true);
    for (const { candidate, score, reasons } of matches) {
      const current = uniqueMatches.get(candidate._id.toString());
      if (!current || score > current.matchPercentage) {
        uniqueMatches.set(candidate._id.toString(), serializeMatch(candidate, score, reasons));
      }
    }
  }

  return [...uniqueMatches.values()]
    .sort((left, right) => right.matchPercentage - left.matchPercentage)
    .slice(0, limit);
}

module.exports = {
  calculateMatch,
  getMatchesForReport,
  getMatchesForUser,
  excludedStatuses
};
