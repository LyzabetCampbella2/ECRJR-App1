// backend/routes/archetypeResultsRoutes.js
import express from "express";

/**
 * Minimal Archetype Results router.
 * Base: /api/archetype-results
 *
 * This file exists to prevent ERR_MODULE_NOT_FOUND and to give you
 * the endpoints your frontend/dashboard/constellation can call.
 *
 * If/when you build a real controller + model, we’ll wire it in.
 */

const router = express.Router();

// ---------------------------
// Helper: 501 stub
// ---------------------------
function notImplemented(name) {
  return (_req, res) =>
    res.status(501).json({
      ok: false,
      message: `Not implemented: ${name}`,
    });
}

// ---------------------------
// Optional controller wiring
// ---------------------------
/**
 * If you later add:
 *   backend/controllers/archetypeResultsController.js
 * with named exports, we’ll use them automatically.
 *
 * Expected (optional) exports:
 * - getLatestArchetypeResult
 * - getArchetypeResultById
 * - listArchetypeResults
 * - upsertArchetypeResult
 */
let controllers = {
  getLatestArchetypeResult: notImplemented("getLatestArchetypeResult"),
  getArchetypeResultById: notImplemented("getArchetypeResultById"),
  listArchetypeResults: notImplemented("listArchetypeResults"),
  upsertArchetypeResult: notImplemented("upsertArchetypeResult"),
};

try {
  const mod = await import("../controllers/archetypeResultsController.js");
  controllers = {
    getLatestArchetypeResult: mod.getLatestArchetypeResult || controllers.getLatestArchetypeResult,
    getArchetypeResultById: mod.getArchetypeResultById || controllers.getArchetypeResultById,
    listArchetypeResults: mod.listArchetypeResults || controllers.listArchetypeResults,
    upsertArchetypeResult: mod.upsertArchetypeResult || controllers.upsertArchetypeResult,
  };
  console.log("✅ LOADED archetypeResultsController.js");
} catch (e) {
  console.log("ℹ️ archetypeResultsController.js not found — using stub handlers.");
}

// ---------------------------
// Routes
// ---------------------------

/**
 * GET /api/archetype-results/ping
 */
router.get("/ping", (_req, res) => {
  res.json({ ok: true, message: "archetype-results router ok" });
});

/**
 * GET /api/archetype-results/latest?profileKey=debug_profile
 * This is the endpoint you tried earlier and got "Route not found".
 */
router.get("/latest", controllers.getLatestArchetypeResult);

/**
 * GET /api/archetype-results
 * Optional listing (admin/debug)
 */
router.get("/", controllers.listArchetypeResults);

/**
 * GET /api/archetype-results/:id
 */
router.get("/:id", controllers.getArchetypeResultById);

/**
 * POST /api/archetype-results
 * Optional upsert (if you want to save results)
 */
router.post("/", controllers.upsertArchetypeResult);

export default router;
