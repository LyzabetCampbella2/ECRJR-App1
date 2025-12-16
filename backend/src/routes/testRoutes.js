const express = require("express");
const router = express.Router();

/**
 * Controllers
 * NOTE: These names MUST exist in ../controllers/testController.js
 * If any one is missing, Express will crash with "requires a callback"
 */
const {
  getTestQuestions,
  startTest,
  submitTestAnswers,
  getResults,
  exportResults,
  getTestProgress
} = require("../controllers/testController");

/* =========================
   SIMPLE INPUT VALIDATION
   ========================= */
function requireBodyFields(fields = []) {
  return (req, res, next) => {
    const missing = fields.filter((f) => req.body?.[f] === undefined || req.body?.[f] === null || req.body?.[f] === "");
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required field(s): ${missing.join(", ")}`
      });
    }
    next();
  };
}

/* =========================
   ROUTES
   ========================= */

/**
 * Health for tests router (optional)
 */
router.get("/", (req, res) => {
  res.json({ success: true, message: "Test routes OK" });
});

/**
 * GET questions for a test
 * /api/tests/questions/language_v1
 */
router.get("/questions/:testId", getTestQuestions);

/**
 * Start a test for a profile
 * Body: { profileId, testId }
 */
router.post(
  "/start",
  requireBodyFields(["profileId", "testId"]),
  startTest
);

/**
 * Submit answers for a test
 * Body: { profileId, testId, answers }
 * answers can be array/object depending on your scoring engine
 */
router.post(
  "/submit",
  requireBodyFields(["profileId", "testId", "answers"]),
  submitTestAnswers
);

/**
 * Get results for a profile
 */
router.get("/results/:profileId", getResults);

/**
 * Export results as JSON for a profile
 */
router.get("/export/:profileId", exportResults);

/**
 * Get test progress for a profile
 */
router.get("/progress/:profileId", getTestProgress);

module.exports = router;
