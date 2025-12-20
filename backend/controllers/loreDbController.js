// backend/controllers/loreDbController.js
import LoreEntry from "../models/LoreEntry.js";

// GET /api/lore/lumi-shadow?kind=luminary|shadow&q=search
export async function getLumiShadowCatalog(req, res) {
  try {
    const kind = req.query.kind ? String(req.query.kind) : "";
    const q = req.query.q ? String(req.query.q).trim() : "";

    const filter = {};
    if (kind === "luminary" || kind === "shadow") filter.kind = kind;

    let items = [];
    if (q) {
      // text search if index present
      items = await LoreEntry.find(
        { ...filter, $text: { $search: q } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" }, kind: 1, name: 1 })
        .lean();
    } else {
      items = await LoreEntry.find(filter).sort({ kind: 1, name: 1 }).lean();
    }

    // Frontend expects a map: { items: { [id]: entry } }
    const map = {};
    for (const it of items) map[it.id] = it;

    return res.json({ success: true, count: items.length, items: map });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error loading lore catalog",
      error: err?.message || String(err),
    });
  }
}

// GET /api/lore/lumi-shadow/:id
export async function getLumiShadowById(req, res) {
  try {
    const { id } = req.params;

    const item = await LoreEntry.findOne({ id }).lean();
    if (!item) {
      return res.status(404).json({ success: false, message: `Lore entry not found: ${id}` });
    }

    return res.json({ success: true, item });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error loading lore entry",
      error: err?.message || String(err),
    });
  }
}
