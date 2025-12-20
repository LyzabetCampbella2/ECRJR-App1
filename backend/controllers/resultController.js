// backend/controllers/resultController.js
const mongoose = require("mongoose");
const Result = require("../models/Result");

/**
 * Canonical API-safe result object
 * - No raw mongoose doc fields leak into the frontend
 * - Ensures arrays/objects are always defined
 */
function normalizeResult(doc) {
  if (!doc) return null;

  return {
    id: String(doc._id || ""),
    userId: String(doc.userId || ""),
    testId: String(doc.testId || ""),
    resultType: doc.resultType || "primary",
    title: doc.title || "",
    overview: doc.overview || "",
    traits: Array.isArray(doc.traits) ? doc.traits : [],
    scores: doc.scores && typeof doc.scores === "object" ? doc.scores : {},
    nextUnlocked: doc.nextUnlocked || "",
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
}

/**
 * GET /api/results/:resultId
 * Get a single result by its id.
 */
exports.getResultById = async (req, res) => {
  try {
    const { resultId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(resultId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resultId",
      });
    }

    const result = await Result.findById(resultId).lean();

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    return res.json({
      success: true,
      result: normalizeResult(result),
    });
  } catch (err) {
    console.error("getResultById error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error fetching result",
    });
  }
};

/**
 * GET /api/results/user/:userId
 * List all results for a given user (newest first).
 */
exports.listResultsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    const results = await Result.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      results: results.map(normalizeResult),
    });
  } catch (err) {
    console.error("listResultsByUser error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error listing results",
    });
  }
};

/**
 * GET /api/results/user/:userId/latest?testId=archetype_v1
 * Return the latest result for a user (optionally filtered by testId).
 */
exports.getLatestResultForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { testId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    const query = { userId };
    if (testId && typeof testId === "string") query.testId = testId;

    const latest = await Result.findOne(query).sort({ createdAt: -1 }).lean();

    if (!latest) {
      return res.json({
        success: true,
        result: null,
        message: "No results found",
      });
    }

    return res.json({
      success: true,
      result: normalizeResult(latest),
    });
  } catch (err) {
    console.error("getLatestResultForUser error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error fetching latest result",
    });
  }
};

/**
 * POST /api/results
 * Create a result (used by your orchestrator after a test completes).
 *
 * Expected body:
 * {
 *   userId, testId, resultType?, title, overview,
 *   traits?, scores?, nextUnlocked?
 * }
 */
exports.createResult = async (req, res) => {
  try {
    const {
      userId,
      testId,
      resultType = "primary",
      title,
      overview,
      traits = [],
      scores = {},
      nextUnlocked = "",
    } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }
    if (!testId || typeof testId !== "string") {
      return res.status(400).json({ success: false, message: "testId is required" });
    }
    if (!title || typeof title !== "string") {
      return res.status(400).json({ success: false, message: "title is required" });
    }
    if (!overview || typeof overview !== "string") {
      return res.status(400).json({ success: false, message: "overview is required" });
    }

    const created = await Result.create({
      userId,
      testId,
      resultType,
      title,
      overview,
      traits: Array.isArray(traits) ? traits : [],
      scores: scores && typeof scores === "object" ? scores : {},
      nextUnlocked: typeof nextUnlocked === "string" ? nextUnlocked : "",
    });

    return res.status(201).json({
      success: true,
      result: normalizeResult(created.toObject()),
    });
  } catch (err) {
    console.error("createResult error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error creating result",
    });
  }
};
