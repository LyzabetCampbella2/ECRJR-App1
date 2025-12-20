// backend/routes/resultRoutes.js
const express = require("express");
const router = express.Router();

const {
  getResultById,
  listResultsByUser,
  getLatestResultForUser,
  createResult,
} = require("../controllers/resultController");

// Health check (optional but helpful)
router.get("/health", (req, res) => {
  res.json({ success: true, message: "Results routes active" });
});

// Create a result (used by orchestrator after scoring)
router.post("/", createResult);

// List all results for a user (newest first)
router.get("/user/:userId", listResultsByUser);

// Get the latest result for a user (optionally filter by testId)
// Example: /api/results/user/123/latest?testId=archetype_v1
router.get("/user/:userId/latest", getLatestResultForUser);

// Get one result by resultId
router.get("/:resultId", getResultById);

module.exports = router;
