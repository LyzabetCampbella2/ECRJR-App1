// backend/controllers/loreController.js
import fs from "fs";
import path from "path";

const DATA_PATH = path.resolve(process.cwd(), "data", "lore.entries.v1.json");

function readLore() {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .trim();
}

export function getLoreIndex(req, res) {
  const q = normalize(req.query.q);
  const type = normalize(req.query.type);
  const tag = normalize(req.query.tag);
  const canon = normalize(req.query.canonLevel);

  const items = readLore();

  let out = items;

  if (type) out = out.filter((x) => normalize(x.type) === type);
  if (canon) out = out.filter((x) => normalize(x.canonLevel) === canon);
  if (tag) out = out.filter((x) => (x.tags || []).some((t) => normalize(t) === tag));

  if (q) {
    out = out.filter((x) => {
      const hay = [
        x.id,
        x.title,
        x.summary,
        x.body,
        ...(x.tags || []),
        ...(x.linkedArchetypes || []),
        ...(x.linkedNodes || []),
      ]
        .map((z) => normalize(z))
        .join(" ");
      return hay.includes(q);
    });
  }

  // index response is lightweight
  const index = out
    .map((x) => ({
      id: x.id,
      type: x.type,
      title: x.title,
      summary: x.summary,
      tags: x.tags || [],
      canonLevel: x.canonLevel,
      linkedArchetypes: x.linkedArchetypes || [],
      linkedNodes: x.linkedNodes || [],
      updatedAt: x.updatedAt || null,
    }))
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));

  return res.json({ ok: true, count: index.length, items: index });
}

export function getLoreById(req, res) {
  const { id } = req.params;
  const items = readLore();
  const found = items.find((x) => x.id === id);

  if (!found) return res.status(404).json({ ok: false, message: "Lore entry not found" });
  return res.json({ ok: true, entry: found });
}

// For constellation integration: fetch lore linked to a nodeId or archetypeId
export function getLoreLinks(req, res) {
  const nodeId = normalize(req.query.nodeId);
  const archetypeId = normalize(req.query.archetypeId);

  if (!nodeId && !archetypeId) {
    return res.status(400).json({ ok: false, message: "Provide nodeId and/or archetypeId" });
  }

  const items = readLore();
  let out = items;

  if (nodeId) {
    out = out.filter((x) => (x.linkedNodes || []).some((n) => normalize(n) === nodeId));
  }

  if (archetypeId) {
    out = out.filter((x) => (x.linkedArchetypes || []).some((a) => normalize(a) === archetypeId));
  }

  const slim = out.map((x) => ({
    id: x.id,
    type: x.type,
    title: x.title,
    summary: x.summary,
    tags: x.tags || [],
    canonLevel: x.canonLevel,
    updatedAt: x.updatedAt || null,
  }));

  return res.json({ ok: true, count: slim.length, items: slim });
}
