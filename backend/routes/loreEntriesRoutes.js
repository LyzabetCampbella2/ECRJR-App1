// backend/routes/loreEntriesRoutes.js
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// If you want to keep the JSON in backend/data, put it there.
// Otherwise, this route can just return a cached in-memory copy later.
const DATA_PATH = path.join(__dirname, "..", "data", "lore.entries.v1.json");

router.get("/entries", (req, res) => {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      return res.status(404).json({
        ok: false,
        message: "lore.entries.v1.json not found at backend/data/",
        expectedPath: DATA_PATH,
      });
    }
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const data = JSON.parse(raw);
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
});

export default router;
