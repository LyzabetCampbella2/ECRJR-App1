// backend/controllers/loreController.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LORE_PATH = path.join(__dirname, "..", "data", "lore.lumiShadow.json");

let CACHE = null;

function loadLore() {
  if (!fs.existsSync(LORE_PATH)) {
    throw new Error(`Lore file not found: ${LORE_PATH}`);
  }
  const raw = fs.readFileSync(LORE_PATH, "utf-8");
  return JSON.parse(raw);
}

function getLore() {
  if (!CACHE) CACHE = loadLore();
  return CACHE;
}

export function getLumiShadowLore(req, res) {
  try {
    const lore = getLore();
    return res.json({ success: true, ...lore });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to load lore catalog",
      error: err?.message || String(err)
    });
  }
}

export function getLoreById(req, res) {
  try {
    const { id } = req.params;
    const lore = getLore();
    const item = lore?.items?.[id];

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Unknown lore id: ${id}`
      });
    }

    return res.json({ success: true, item });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to load lore item",
      error: err?.message || String(err)
    });
  }
}
