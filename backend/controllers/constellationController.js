// backend/controllers/constellationController.js
import User from "../models/User.js";
import { loadCatalogs } from "../utils/catalog.js";

function pickLore(entry) {
  if (!entry) return null;
  return {
    name: entry.name ?? "",
    overview: entry.overview ?? "",
    traits: Array.isArray(entry.traits) ? entry.traits : [],
    gifts: Array.isArray(entry.gifts) ? entry.gifts : [],
    shadowWarning: entry.shadowWarning ?? "",
    cost: entry.cost ?? "",
    antidote: entry.antidote ?? "",
    ritual: entry.ritual ?? "",
  };
}

function safeLabel(id, dict, fallback) {
  if (!id) return fallback;
  const hit = dict?.[id];
  return hit?.name || `${fallback} (${id})`;
}

export async function getConstellation(req, res) {
  try {
    const userId = req.user?.id || req.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const { lumById, shadById } = loadCatalogs();

    const lum = user?.constellation?.luminaries || [];
    const shad = user?.constellation?.shadows || [];

    const nodes = [];

    lum.slice(0, 5).forEach((item, idx) => {
      const entry = lumById?.[item.id];
      nodes.push({
        id: `lum_${idx + 1}`,
        kind: "luminary",
        luminaryId: item.id,
        label: safeLabel(item.id, lumById, `Luminary ${idx + 1}`),
        score: item.score ?? null,
        lore: pickLore(entry),
      });
    });

    shad.slice(0, 5).forEach((item, idx) => {
      const entry = shadById?.[item.id];
      nodes.push({
        id: `shad_${idx + 1}`,
        kind: "shadow",
        shadowId: item.id,
        label: safeLabel(item.id, shadById, `Shadow ${idx + 1}`),
        score: item.score ?? null,
        lore: pickLore(entry),
      });
    });

    // edges (simple full mesh between top 5 + top 5)
    const edges = [];
    for (let i = 1; i <= Math.min(5, lum.length); i++) {
      for (let j = 1; j <= Math.min(5, shad.length); j++) {
        edges.push({ from: `lum_${i}`, to: `shad_${j}` });
      }
    }

    return res.json({ success: true, constellation: { nodes, edges } });
  } catch (err) {
    console.error("getConstellation error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
