// backend/routes/testBankRoutes.js
import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

/**
 * Map a friendly id to a filename.
 * You can add more banks later.
 */
function resolveBankFile(bankId) {
  const map = {
    archetype: "archetypeTest.bank.json",
    // add later:
    // luminary: "luminaryMini.bank.json",
    // shadow: "shadowMini.bank.json",
  };

  const file = map[bankId];
  if (!file) return null;

  // IMPORTANT: resolve from backend working directory
  return path.resolve(process.cwd(), "data", "testBanks", file);
}

function safeReadJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");

  // Guard against empty files or partial writes
  if (!raw || !raw.trim()) {
    const err = new Error("Bank file is empty");
    err.code = "EMPTY_FILE";
    throw err;
  }

  try {
    return JSON.parse(raw);
  } catch (e) {
    const err = new Error(`Invalid JSON in bank file: ${path.basename(filePath)} — ${e.message}`);
    err.code = "INVALID_JSON";
    throw err;
  }
}

// GET /api/testbanks (helpful listing)
router.get("/", (req, res) => {
  res.json({
    ok: true,
    available: [
      { id: "archetype", path: "data/testBanks/archetypeTest.bank.json" }
    ]
  });
});

// GET /api/testbanks/:id
router.get("/:id", (req, res) => {
  try {
    const { id } = req.params;

    const filePath = resolveBankFile(id);
    if (!filePath) {
      return res.status(404).json({ ok: false, message: "Test bank not found" });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        ok: false,
        message: "Test bank file missing on server",
        expected: filePath
      });
    }

    const data = safeReadJson(filePath);

    // Optional: sanity checks so frontend doesn’t explode
    const questions = Array.isArray(data.questions) ? data.questions : [];
    const payload = {
      ...data,
      id: data.id || data.testId || id,
      testId: data.testId || data.id || id,
      questions
    };

    res.json(payload);
  } catch (e) {
    console.error("❌ testbank route error:", e);
    res.status(500).json({
      ok: false,
      message: "Server error",
      error: e?.message || String(e)
    });
  }
});

export default router;
