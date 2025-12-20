// backend/utils/resultsEngine.js
// ESM (works with "type":"module")

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------
// Helpers
// ---------------------------
function normalizeLikert(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n >= 1 && n <= 5) return (n - 1) / 4; // 0..1
  if (n >= 0 && n <= 10) return n / 10;     // 0..1
  return null;
}

function flattenQuestions(definition) {
  const out = [];
  for (const cat of definition?.categories || []) {
    const catId = cat.categoryId || cat.id || cat.name || "uncategorized";
    const catTitle = cat.title || cat.name || catId;
    for (const q of cat.questions || []) {
      out.push({ ...q, _categoryId: catId, _categoryTitle: catTitle });
    }
  }
  return out;
}

function hashToInt(str) {
  const hex = crypto.createHash("sha256").update(str).digest("hex").slice(0, 8);
  return parseInt(hex, 16);
}

function scoreBand(score0_100) {
  const s = Number(score0_100);
  if (s >= 85) return "S";
  if (s >= 70) return "A";
  if (s >= 55) return "B";
  if (s >= 40) return "C";
  return "D";
}

function safeReadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// ---------------------------
// Scoring
// ---------------------------
export function computeScores(definition, answers) {
  const qs = flattenQuestions(definition).filter((q) => q.type === "likert");
  const qById = new Map(qs.map((q) => [q.questionId, q]));

  const totals = new Map(); // catId -> { sum, n, title }
  for (const a of answers || []) {
    const q = qById.get(a?.questionId);
    if (!q) continue;

    const v = normalizeLikert(a?.value);
    if (v === null) continue;

    const prev = totals.get(q._categoryId) || { sum: 0, n: 0, title: q._categoryTitle };
    totals.set(q._categoryId, { sum: prev.sum + v, n: prev.n + 1, title: prev.title });
  }

  const categoryScores = [];
  for (const [categoryId, t] of totals.entries()) {
    const avg01 = t.n ? t.sum / t.n : 0;
    categoryScores.push({
      categoryId,
      title: t.title,
      average01: avg01,
      score0_100: Math.round(avg01 * 100),
      answered: t.n
    });
  }

  categoryScores.sort((a, b) => b.score0_100 - a.score0_100);

  const overall01 =
    categoryScores.length
      ? categoryScores.reduce((acc, c) => acc + c.average01, 0) / categoryScores.length
      : 0;

  return {
    overall01,
    overallScore0_100: Math.round(overall01 * 100),
    categoryScores
  };
}

// ---------------------------
// Facet: Luminary / Shadow / Balanced
// ---------------------------
export function labelLuminaryShadow(categoryScores) {
  if (!categoryScores?.length) return "Balanced";
  const top = categoryScores[0].score0_100;
  const bottom = categoryScores[categoryScores.length - 1].score0_100;

  // Tune later if you want
  if (top >= 70 && bottom <= 25) return "Shadow";
  if (top >= 70 && bottom >= 40) return "Luminary";
  return "Balanced";
}

// ---------------------------
// Catalog + Keymap loading
// ---------------------------
let _catalogCache = null;
let _keyMapCache = null;

function catalogPath() {
  return path.join(__dirname, "..", "data", "archetypes", "main_v1.archetypes.json");
}
function keymapPath() {
  // Optional file. You can add/expand this without changing code.
  // Format: { "<fingerprintKey>": "M123", ... }
  return path.join(__dirname, "..", "data", "archetypes", "main_v1.keymap.json");
}

export function loadMainArchetypeCatalog() {
  if (_catalogCache) return _catalogCache;

  const p = catalogPath();
  const raw = fs.readFileSync(p, "utf-8");
  const json = JSON.parse(raw);

  if (!Array.isArray(json) || json.length < 1) {
    throw new Error("main_v1.archetypes.json invalid (expected non-empty array).");
  }

  for (const a of json) {
    if (!a?.id || !a?.name) {
      throw new Error("Invalid archetype entry (missing id/name) in main_v1.archetypes.json");
    }
  }

  _catalogCache = json;
  return _catalogCache;
}

export function loadMainArchetypeKeyMap() {
  if (_keyMapCache) return _keyMapCache;
  _keyMapCache = safeReadJson(keymapPath(), {}); // optional
  return _keyMapCache;
}

// ---------------------------
// Fingerprint + selection
// ---------------------------
export function buildFingerprint(definition, scores) {
  const facet = labelLuminaryShadow(scores.categoryScores);

  const top3 = scores.categoryScores.slice(0, 3).map((c) => c.categoryId);
  const bands = scores.categoryScores
    .slice(0, 6)
    .map((c) => scoreBand(c.score0_100))
    .join("");

  const testId = definition?.testId || definition?.id || "main_v1";
  const key = `${top3.join("+")}|${bands}|${facet}`;
  const seed = `${testId}|${key}`;

  return { facet, top3, bands, key, seed };
}

export function pickArchetypeFromCatalog(catalog, fingerprint) {
  const keyMap = loadMainArchetypeKeyMap();

  // 1) LOCKED mapping if present:
  const mappedId = keyMap?.[fingerprint.key];
  if (mappedId) {
    const found = catalog.find((a) => a.id === mappedId);
    if (found) return found;
  }

  // 2) Deterministic hash fallback:
  const idx = hashToInt(fingerprint.seed) % catalog.length;
  return catalog[idx];
}

export function deriveArchetype(definition, scores) {
  const catalog = loadMainArchetypeCatalog();
  const fingerprint = buildFingerprint(definition, scores);
  const chosen = pickArchetypeFromCatalog(catalog, fingerprint);

  const facetTitle =
    chosen?.facetTitles?.[fingerprint.facet] ||
    (fingerprint.facet === "Luminary" ? "Crowned" : fingerprint.facet === "Shadow" ? "Veiled" : "Clear");

  // Lore is optional but supported
  const lore = chosen?.lore || null;

  return {
    archetypeId: chosen.id,
    archetypeName: chosen.name,
    luminaryOrShadow: fingerprint.facet,
    facetTitle,
    tags: chosen.tags || [],
    focus: chosen.focus || null,
    summary: chosen.summary || null,
    strengths: chosen.strengths || [],
    growthEdges: chosen.growthEdges || [],
    lore,
    fingerprint
  };
}

// ---------------------------
// Final result payload
// ---------------------------
export function buildResultPayload(definition, answers) {
  const scores = computeScores(definition, answers);
  const archetype = deriveArchetype(definition, scores);

  const strengthsTop = scores.categoryScores.slice(0, 3).map((c) => c.title || c.categoryId);
  const edgesLow = scores.categoryScores.slice(-2).map((c) => c.title || c.categoryId);

  return {
    overall01: scores.overall01,
    overallScore0_100: scores.overallScore0_100,
    categoryScores: scores.categoryScores,

    ...archetype,

    topStrengthCategories: strengthsTop,
    lowestCategories: edgesLow
  };
}
