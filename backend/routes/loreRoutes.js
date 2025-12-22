// backend/routes/loreRoutes.js
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Your file should be here:
const DATA_PATH = path.join(__dirname, "..", "data", "lore.entries.v1.json");

function loadDoc() {
  if (!fs.existsSync(DATA_PATH)) return null;
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

/**
 * Canonical: GET /api/lore/entries
 */
router.get("/entries", (req, res) => {
  try {
    const doc = loadDoc();
    if (!doc) {
      return res.status(404).json({
        ok: false,
        message: "lore.entries.v1.json not found",
        expectedPath: DATA_PATH,
      });
    }
    return res.json({ ok: true, data: doc });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
});

/**
 * Canonical: GET /api/lore/entries/:id
 */
router.get("/entries/:id", (req, res) => {
  try {
    const doc = loadDoc();
    if (!doc) return res.status(404).json({ ok: false, message: "Lore store missing" });

    const id = String(req.params.id || "").trim();
    const found = (doc.nodes || []).find((n) => n.id === id);
    if (!found) return res.status(404).json({ ok: false, message: "Lore entry not found" });

    return res.json({ ok: true, data: found });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
});

/**
 * ✅ ALIAS: some pages call /api/lore/entry/:id
 */
router.get("/entry/:id", (req, res) => {
  // just forward to the canonical handler
  req.url = `/entries/${req.params.id}`;
  router.handle(req, res);
});

/**
 * ✅ ALIAS: some pages call /api/lore/index or /api/lore/library
 */
router.get(["/index", "/library"], (req, res) => {
  try {
    const doc = loadDoc();
    if (!doc) return res.status(404).json({ ok: false, message: "Lore store missing" });

    const items = (doc.nodes || []).map((n) => ({
      id: n.id,
      entryType: n.entryType,
      title: n.title || n.id,
      archId: n.archId || null,
      glyph: n.glyph || null,
      linkedCount: Array.isArray(n.linkedNodes) ? n.linkedNodes.length : 0,
    }));

    return res.json({ ok: true, data: items });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
});

/**
 * ✅ Optional: quick search endpoint for any UI that expects it
 * GET /api/lore/search?q=...
 */
router.get("/search", (req, res) => {
  try {
    const doc = loadDoc();
    if (!doc) return res.status(404).json({ ok: false, message: "Lore store missing" });

    const q = String(req.query.q || "").trim().toLowerCase();
    if (!q) return res.json({ ok: true, data: [] });

    const hits = (doc.nodes || [])
      .filter((n) => {
        const hay = `${n.id} ${n.title || ""} ${n.archId || ""} ${n.lore || ""} ${n.shadowReflection || ""}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 50)
      .map((n) => ({ id: n.id, title: n.title || n.id, entryType: n.entryType, archId: n.archId || null }));

    return res.json({ ok: true, data: hits });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
});

export default router;
