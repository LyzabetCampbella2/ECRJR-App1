// backend/src/controllers/testController.js

const { store, save } = require("../utils/memoryStore");
const { getNextTestById, getRealmForTest } = require("../utils/testOrchestrator");
const { getQuestions } = require("../utils/testQuestions");
const { scoreTest } = require("../utils/scoringEngine");

/* =========================
   START TEST
   ========================= */
function startTest(req, res) {
  const { profileId } = req.body;

  const profile = store.profiles[profileId];
  if (!profile) {
    return res.status(404).json({
      success: false,
      message: "Profile not found"
    });
  }

  res.json({
    success: true,
    testId: profile.activeTestId,
    realm: getRealmForTest(profile.activeTestId)
  });
}

/* =========================
   GET QUESTIONS
   ========================= */
function getTestQuestions(req, res) {
  const { testId } = req.params;

  const questions = getQuestions(testId);

  res.json({
    success: true,
    testId,
    questions
  });
}

/* =========================
   SUBMIT TEST
   ========================= */
function submitTest(req, res) {
  const { profileId, testId, answers } = req.body;

  const profile = store.profiles[profileId];
  if (!profile) {
    return res.status(404).json({
      success: false,
      message: "Profile not found"
    });
  }

  // 🔒 Enforce orchestrator order
  if (testId !== profile.activeTestId) {
    return res.status(400).json({
      success: false,
      expectedTestId: profile.activeTestId,
      receivedTestId: testId
    });
  }

  // 🧮 Score test
  const result = scoreTest(testId, answers || []);

  // 🧠 Persist result
  if (!store.resultsByProfile[profileId]) {
    store.resultsByProfile[profileId] = {};
  }
  store.resultsByProfile[profileId][testId] = result;

  // ➡ Advance flow
  profile.completedTestIds.push(testId);
  profile.activeTestId = getNextTestById(testId) || "";

  // 💾 Save to JSON
  save();

  res.json({
    success: true,
    result,
    nextTestId: profile.activeTestId,
    nextRealm: profile.activeTestId
      ? getRealmForTest(profile.activeTestId)
      : null
  });
}

/* =========================
   GET PROGRESS
   ========================= */
function getProgress(req, res) {
  const { profileId } = req.params;

  const profile = store.profiles[profileId];
  if (!profile) {
    return res.status(404).json({
      success: false,
      message: "Profile not found"
    });
  }

  res.json({
    success: true,
    activeTestId: profile.activeTestId,
    completedTestIds: profile.completedTestIds
  });
}

/* =========================
   GET RESULTS
   ========================= */
function getResults(req, res) {
  const { profileId } = req.params;

  res.json({
    success: true,
    results: store.resultsByProfile[profileId] || {}
  });
}

/* =========================
   EXPORTS
   ========================= */
module.exports = {
  startTest,
  getTestQuestions,
  submitTest,
  getProgress,
  getResults
};
function exportResults(req, res) {
  const { profileId } = req.params;
  const results = store.resultsByProfile[profileId];

  if (!results) {
    return res.status(404).json({ success: false, message: "No results" });
  }

  res.json({
    success: true,
    exportedAt: new Date().toISOString(),
    profileId,
    results
  });
}
