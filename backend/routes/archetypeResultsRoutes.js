// backend/routes/archetypeResultsRoutes.js
import express from "express";

/**
 * Minimal Archetype Results router.
 * Base: /api/archetype-results
 *
 * Exists so server.js can import it without ERR_MODULE_NOT_FOUND.
 * Later we can wire real controllers/models.
 */

const router = express.Router();

function notImplemented(name) {
  return (_req, res) =>
    res.status(501).json({
      ok: false,
      message: `Not implemented: ${name}`,
    });
}

let controllers = {
  getLatestArchetypeResult: notImplemented("getLatestArchetypeResult"),
  getArchetypeResultById: notImplemented("getArchetypeResultById"),
  listArchetypeResults: notImplemented("listArchetypeResults"),
  upsertArchetypeResult: notImplemented("upsertArchetypeResult"),
};

try {
  const mod = await import("../controllers/archetypeResultsController.js");
  controllers = {
    getLatestArchetypeResult:
      mod.getLatestArchetypeResult || controllers.getLatestArchetypeResult,
    getArchetypeResultById:
      mod.getArchetypeResultById || controllers.getArchetypeResultById,
    listArchetypeResults: mod.listArchetypeResults || controllers.listArchetypeResults,
    upsertArchetypeResult: mod.upsertArchetypeResult || controllers.upsertArchetypeResult,
  };
  console.log("✅ LOADED archetypeResultsController.js");
} catch (e) {
  console.log("ℹ️ archetypeResultsController.js not found — using stub handlers.");
}

router.get("/ping", (_req, res) => {
  res.json({ ok: true, message: "archetype-results router ok" });
});

// GET /api/archetype-results/latest?profileKey=debug_profile
router.get("/latest", controllers.getLatestArchetypeResult);

// GET /api/archetype-results
router.get("/", controllers.listArchetypeResults);

// GET /api/archetype-results/:id
router.get("/:id", controllers.getArchetypeResultById);

// POST /api/archetype-results
router.post("/", controllers.upsertArchetypeResult);

export default router;
