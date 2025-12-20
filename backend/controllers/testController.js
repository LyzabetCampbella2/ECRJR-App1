// backend/controllers/testController.js
const mongoose = require("mongoose");
const Result = require("../models/Result");
const TestProgress = require("../models/TestProgress");

// Optional progress logger (safe if missing)
let progressLog = null;
try {
  progressLog = require("../utils/testProgressLog");
} catch {
  progressLog = null;
}

// Robust orchestrator import
let advanceOrchestrator;
try {
  const mod = require("../utils/advanceOrchestrator");
  advanceOrchestrator =
    typeof mod === "function" ? mod : mod.advanceOrchestrator || mod.default;
} catch (e) {
  console.error("❌ Could not load advanceOrchestrator:", e.message);
  advanceOrchestrator = null;
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

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

function normalizeProgress(p) {
  if (!p) return null;
  return {
    userId: String(p.userId),
    activeTestId: p.activeTestId || "",
    expectedTestId: p.expectedTestId || "",
    completedTests: Array.isArray(p.completedTests) ? p.completedTests : [],
    completedCount: typeof p.completedCount === "number" ? p.completedCount : 0,
    lastResultId: p.lastResultId ? String(p.lastResultId) : null,
    startedAt: p.startedAt || null,
    lastSubmittedAt: p.lastSubmittedAt || null,
    createdAt: p.createdAt || null,
    updatedAt: p.updatedAt || null,
  };
}

/**
 * POST /api/tests/start
 * Body: { userId, testId }
 *
 * Strict mode:
 * - Sets active + expected to testId
 * - Creates progress if missing
 */
exports.startTest = async (req, res) => {
  try {
    const { userId, testId } = req.body || {};

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }
    if (!testId || typeof testId !== "string") {
      return res.status(400).json({ success: false, message: "testId is required" });
    }

    const progress = await TestProgress.findOneAndUpdate(
      { userId },
      {
        $set: {
          activeTestId: testId,
          expectedTestId: testId,
          startedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    if (progressLog?.log) {
      progressLog.log({ userId, testId, event: "START_TEST", meta: { expectedTestId: testId } });
    }

    return res.json({
      success: true,
      message: "Test started",
      progress: normalizeProgress(progress.toObject ? progress.toObject() : progress),
    });
  } catch (err) {
    console.error("startTest error:", err);
    return res.status(500).json({ success: false, message: "Server error starting test" });
  }
};

/**
 * POST /api/tests/submit
 * Body: { userId, testId, answers }
 *
 * Strict mode:
 * - Must match expectedTestId (if present)
 * - Runs orchestrator
 * - Applies Day 20 tier guardrails
 * - Saves result
 * - Updates TestProgress (expected next test)
 */
exports.submitTest = async (req, res) => {
  try {
    const { userId, testId, answers } = req.body || {};

    // Validate
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }
    if (!testId || typeof testId !== "string") {
      return res.status(400).json({ success: false, message: "testId is required" });
    }
    if (!answers || (typeof answers !== "object" && !Array.isArray(answers))) {
      return res.status(400).json({ success: false, message: "answers is required" });
    }
    if (!advanceOrchestrator) {
      return res.status(500).json({
        success: false,
        message: "advanceOrchestrator not available (check backend/utils/advanceOrchestrator.js)",
      });
    }

    // Load or create progress
    let progress = await TestProgress.findOne({ userId });
    if (!progress) {
      progress = await TestProgress.create({
        userId,
        activeTestId: testId,
        expectedTestId: testId,
        startedAt: new Date(),
      });
    }

    // Strict enforcement: must match expectedTestId if set
    if (progress.expectedTestId && progress.expectedTestId !== testId) {
      if (progressLog?.log) {
        progressLog.log({
          userId,
          testId,
          event: "SUBMIT_BLOCKED",
          meta: { expectedTestId: progress.expectedTestId, receivedTestId: testId },
        });
      }

      return res.status(400).json({
        success: false,
        message: "Cannot submit this test right now",
        expectedTestId: progress.expectedTestId,
        receivedTestId: testId,
      });
    }

    // Orchestrate
    const orch = await advanceOrchestrator({ userId, testId, answers });
    const computed = orch?.computed || orch?.result || orch || {};
    const nextUnlockedRaw =
      orch?.nextUnlocked || orch?.next || computed?.nextUnlocked || "";

    // Safe fields
    const title =
      typeof computed?.title === "string" && computed.title.trim()
        ? computed.title.trim()
        : "Untitled Result";

    const overview =
      typeof computed?.overview === "string" && computed.overview.trim()
        ? computed.overview.trim()
        : "Result generated.";

    const traits = Array.isArray(computed?.traits) ? computed.traits : [];
    const scores =
      computed?.scores && typeof computed.scores === "object" ? computed.scores : {};

    let resultType =
      computed?.resultType === "shadow" || computed?.resultType === "luminary"
        ? computed.resultType
        : "primary";

    const nextUnlocked = typeof nextUnlockedRaw === "string" ? nextUnlockedRaw : "";

    // ----------------------------
    // Day 20 Tier Guardrails
    // ----------------------------
    let guardedResultType = resultType;

    // Shadow requires Primary
    if (guardedResultType === "shadow") {
      const hasPrimary = await Result.exists({ userId, resultType: "primary" });
      if (!hasPrimary) guardedResultType = "primary";
    }

    // Luminary requires Shadow
    if (guardedResultType === "luminary") {
      const hasShadow = await Result.exists({ userId, resultType: "shadow" });
      if (!hasShadow) guardedResultType = "primary";
    }

    // Save result
    const saved = await Result.create({
      userId,
      testId,
      resultType: guardedResultType,
      title,
      overview,
      traits,
      scores,
      nextUnlocked,
    });

    // Update progress
    const completedSet = new Set(progress.completedTests || []);
    completedSet.add(testId);

    progress.completedTests = Array.from(completedSet);
    progress.completedCount = progress.completedTests.length;

    progress.lastResultId = saved._id;
    progress.lastSubmittedAt = new Date();

    // Strict: one next test at a time
    progress.activeTestId = nextUnlocked || "";
    progress.expectedTestId = nextUnlocked || "";

    await progress.save();

    if (progressLog?.log) {
      progressLog.log({
        userId,
        testId,
        event: "SUBMIT_OK",
        meta: {
          intendedResultType: resultType,
          finalResultType: guardedResultType,
          nextUnlocked,
        },
      });
    }

    return res.json({
      success: true,
      message: "Test submitted, result saved, progress updated",
      nextUnlocked: saved.nextUnlocked || "",
      result: normalizeResult(saved.toObject ? saved.toObject() : saved),
      progress: normalizeProgress(progress.toObject ? progress.toObject() : progress),
      guardrail: {
        intendedResultType: resultType,
        finalResultType: guardedResultType,
      },
    });
  } catch (err) {
    console.error("submitTest error:", err);

    if (progressLog?.log) {
      progressLog.log({
        userId: req?.body?.userId,
        testId: req?.body?.testId,
        event: "SUBMIT_ERROR",
        meta: { error: err?.message || String(err) },
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error submitting test",
      error: err?.message || String(err),
    });
  }
};

/**
 * GET /api/tests/progress/:userId
 */
exports.getProgress = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }

    const progress = await TestProgress.findOne({ userId }).lean();

    return res.json({
      success: true,
      progress: progress ? normalizeProgress(progress) : null,
    });
  } catch (err) {
    console.error("getProgress error:", err);
    return res.status(500).json({ success: false, message: "Server error fetching progress" });
  }
};
