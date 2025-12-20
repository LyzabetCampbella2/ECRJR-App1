import fs from "fs";
import path from "path";

/**
 * Location of your mini test data.
 * Adjust ONLY if your file lives elsewhere.
 */
const DATA_PATH = path.join(
  process.cwd(),
  "data",
  "miniTests.lumiShadow.json"
);

export function getMiniTestById(req, res) {
  try {
    const { miniId } = req.params;

    if (!miniId) {
      return res.status(400).json({ error: "Missing miniId" });
    }

    if (!fs.existsSync(DATA_PATH)) {
      return res.status(500).json({
        error: "Mini test data file not found",
        path: DATA_PATH,
      });
    }

    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const json = JSON.parse(raw);

    const test =
      json?.[miniId] ||
      json?.tests?.[miniId] ||
      json?.miniTests?.[miniId] ||
      null;

    if (!test) {
      return res.status(404).json({
        error: "Mini test not found",
        miniId,
        available: Object.keys(json || {}).slice(0, 20),
      });
    }

    return res.json({
      id: miniId,
      ...test,
    });
  } catch (err) {
    console.error("❌ Mini test load failed:", err);
    return res.status(500).json({
      error: "Failed to load mini test",
      details: String(err?.message || err),
    });
  }
}
