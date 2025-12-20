// backend/routes/testRoutes.js
import express from "express";

const router = express.Router();

/**
 * Safe loader so missing controller exports do NOT crash the server.
 * Instead the endpoint returns a helpful 501 error telling you what's missing.
 */
async function loadController() {
  try {
    const mod = await import("../controllers/testController.js");
    return mod;
  } catch (err) {
    return { __loadError: err };
  }
}

function notImplemented(res, detail) {
  return res.status(501).json({
    success: false,
    message: "Endpoint not implemented (controller missing or export not found).",
    detail,
  });
}

// Health check
router.get("/ping", (req, res) => {
  res.json({ success: true, message: "tests routes alive" });
});

/**
 * POST /api/tests/start
 * Body: { testId }
 */
router.post("/start", async (req, res) => {
  const ctrl = await loadController();

  if (ctrl.__loadError) {
    return notImplemented(res, `Could not import controllers/testController.js: ${String(ctrl.__loadError)}`);
  }

  if (typeof ctrl.startTest !== "function") {
    return notImplemented(res, "Missing export: startTest in controllers/testController.js");
  }

  return ctrl.startTest(req, res);
});

/**
 * POST /api/tests/submit
 * Body: { testId, answers }
 */
router.post("/submit", async (req, res) => {
  const ctrl = await loadController();

  if (ctrl.__loadError) {
    return notImplemented(res, `Could not import controllers/testController.js: ${String(ctrl.__loadError)}`);
  }

  // Some projects name this submitTest, some submitTestAnswers — support both
  const handler =
    typeof ctrl.submitTestAnswers === "function"
      ? ctrl.submitTestAnswers
      : typeof ctrl.submitTest === "function"
      ? ctrl.submitTest
      : null;

  if (!handler) {
    return notImplemented(
      res,
      "Missing export: submitTestAnswers (or submitTest) in controllers/testController.js"
    );
  }

  return handler(req, res);
});

/**
 * GET /api/tests/progress
 * Returns current progress for dashboard
 */
router.get("/progress", async (req, res) => {
  const ctrl = await loadController();

  if (ctrl.__loadError) {
    return notImplemented(res, `Could not import controllers/testController.js: ${String(ctrl.__loadError)}`);
  }

  const handler =
    typeof ctrl.getTestProgress === "function"
      ? ctrl.getTestProgress
      : typeof ctrl.getProgress === "function"
      ? ctrl.getProgress
      : null;

  if (!handler) {
    return notImplemented(
      res,
      "Missing export: getTestProgress (or getProgress) in controllers/testController.js"
    );
  }

  return handler(req, res);
});

/**
 * GET /api/tests/results
 * Returns major test results (and/or combined results)
 */
router.get("/results", async (req, res) => {
  const ctrl = await loadController();

  if (ctrl.__loadError) {
    return notImplemented(res, `Could not import controllers/testController.js: ${String(ctrl.__loadError)}`);
  }

  const handler =
    typeof ctrl.getResults === "function"
      ? ctrl.getResults
      : typeof ctrl.getTestResults === "function"
      ? ctrl.getTestResults
      : null;

  if (!handler) {
    return notImplemented(
      res,
      "Missing export: getResults (or getTestResults) in controllers/testController.js"
    );
  }

  return handler(req, res);
});

/**
 * OPTIONAL: POST /api/tests/reset
 * Useful while developing.
 * If you don't have it, you'll get a clean 501 instead of crashing.
 */
router.post("/reset", async (req, res) => {
  const ctrl = await loadController();

  if (ctrl.__loadError) {
    return notImplemented(res, `Could not import controllers/testController.js: ${String(ctrl.__loadError)}`);
  }

  if (typeof ctrl.resetTests !== "function") {
    return notImplemented(res, "Missing export: resetTests in controllers/testController.js");
  }

  return ctrl.resetTests(req, res);
});

export default router;
