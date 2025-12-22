// backend/controllers/resultController.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MINI_STORE_PATH = path.join(__dirname, "..", "data", "miniSuite.store.json");

// --- helpers ---
function readJSON(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function toNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function topNEntries(obj, n = 10) {
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(obj)
    .map(([id, score]) => ({ id, score: toNum(score) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

function stablePickName(constId) {
  // simple deterministic titles you can replace later with your lore library
  const map = {
    C01: "The Auditor",
    C02: "The Artisan",
    C03: "The Healer",
    C04: "The Warden",
    C05: "The Truthblade",
    C06: "The Veilkeeper",
    C07: "The Harmonist",
    C08: "The Catalyst",
    C09: "The Watcher",
    C10: "The Vanguard",
    C11: "The Hearthbound",
    C12: "The Refiner",
    C13: "The Architect",
    C14: "The Masterwork",
    C15: "The Mythweaver",
    C16: "The Lumen"
  };
  return map[constId] || constId;
}

function buildAspect(constId, tone, score, extra = {}) {
  return {
    id: constId,
    name: stablePickName(constId),
    tone, // "lum" | "shd" | "mix"
    score: Math.round(score * 100) / 100,
    ...extra
  };
}

function getMiniProfile(store, profileKey) {
  const p = store?.profiles?.[profileKey];
  return p || null;
}

function getToneScoresForConst(constTone, constId) {
  const bucket = (constTone && constTone[constId]) || {};
  return {
    lum: toNum(bucket.lum),
    mix: toNum(bucket.mix),
    shd: toNum(bucket.shd),
  };
}

function buildAxes(luminaries, shadows) {
  const axes = [];
  const L = luminaries.slice(0, 5);
  const S = shadows.slice(0, 5);

  for (let i = 0; i < 5; i++) {
    axes.push({
      axis: i + 1,
      luminary: L[i] || null,
      shadow: S[i] || null,
      label: L[i] && S[i] ? `${L[i].name} ↔ ${S[i].name}` : "—",
    });
  }
  return axes;
}

function summaryFromAspects(luminaries, shadows, totalsTone) {
  const lum = toNum(totalsTone?.lum);
  const mix = toNum(totalsTone?.mix);
  const shd = toNum(totalsTone?.shd);
  const total = Math.max(1, lum + mix + shd);

  const lumPct = Math.round((lum / total) * 100);
  const mixPct = Math.round((mix / total) * 100);
  const shdPct = Math.round((shd / total) * 100);

  return {
    toneBalance: { lum, mix, shd, lumPct, mixPct, shdPct },
    headline: luminaries?.[0]
      ? `Your strongest luminary signal is ${luminaries[0].name}.`
      : "No luminary signal yet.",
    caution: shadows?.[0]
      ? `Your strongest shadow-protective signal is ${shadows[0].name}.`
      : "No shadow signal yet.",
  };
}

// ✅ GET /api/results/assemble?profileKey=...
export function assembleResults(req, res) {
  try {
    const profileKey = String(req.query.profileKey || "");
    if (!profileKey) {
      return res.status(400).json({ ok: false, message: "profileKey query param is required" });
    }

    const store = readJSON(MINI_STORE_PATH);
    const prof = getMiniProfile(store, profileKey);

    if (!prof) {
      return res.json({
        ok: true,
        profileKey,
        finalResult: {
          profileKey,
          version: 1,
          sources: { miniSuite: { status: "missing" } },
          luminaries: [],
          shadows: [],
          axes: [],
          totals: { const: {}, tone: {}, constTone: {} },
          summary: { toneBalance: { lum: 0, mix: 0, shd: 0, lumPct: 0, mixPct: 0, shdPct: 0 } }
        }
      });
    }

    const totals = prof.totals || { const: {}, tone: {}, constTone: {} };
    const constTotals = totals.const || {};
    const constTone = totals.constTone || {};

    // Build luminaries: rank by lum score within each constellation
    const lumCandidates = Object.keys(constTotals).map((cid) => {
      const t = getToneScoresForConst(constTone, cid);
      return { id: cid, score: t.lum, toneScores: t };
    });
    lumCandidates.sort((a, b) => b.score - a.score);

    // Build shadows: rank by shd score within each constellation
    const shdCandidates = Object.keys(constTotals).map((cid) => {
      const t = getToneScoresForConst(constTone, cid);
      return { id: cid, score: t.shd, toneScores: t };
    });
    shdCandidates.sort((a, b) => b.score - a.score);

    // If there’s not enough lum/shd data, fall back to overall constellation totals
    const fallbackConst = topNEntries(constTotals, 16).map((x) => x.id);

    const luminaries = [];
    for (const c of lumCandidates) {
      if (c.score > 0) luminaries.push(buildAspect(c.id, "lum", c.score, { toneScores: c.toneScores }));
      if (luminaries.length >= 5) break;
    }
    // Fill remaining luminaries with top const totals as mix
    for (const cid of fallbackConst) {
      if (luminaries.length >= 5) break;
      if (luminaries.some((x) => x.id === cid)) continue;
      const t = getToneScoresForConst(constTone, cid);
      luminaries.push(buildAspect(cid, "mix", toNum(constTotals[cid]), { toneScores: t }));
    }

    const shadows = [];
    for (const c of shdCandidates) {
      if (c.score > 0) shadows.push(buildAspect(c.id, "shd", c.score, { toneScores: c.toneScores }));
      if (shadows.length >= 5) break;
    }
    // Fill remaining shadows with top const totals as mix
    for (const cid of fallbackConst) {
      if (shadows.length >= 5) break;
      if (shadows.some((x) => x.id === cid)) continue;
      const t = getToneScoresForConst(constTone, cid);
      shadows.push(buildAspect(cid, "mix", toNum(constTotals[cid]), { toneScores: t }));
    }

    const axes = buildAxes(luminaries, shadows);
    const summary = summaryFromAspects(luminaries, shadows, totals.tone);

    const finalResult = {
      profileKey,
      version: 1,
      generatedAt: new Date().toISOString(),
      sources: {
        miniSuite: {
          status: prof.suiteStatus || "unknown",
          submissionsCount: Array.isArray(prof.submissions) ? prof.submissions.length : 0
        }
      },
      luminaries,
      shadows,
      axes,
      totals,
      summary,
      // placeholder for later: merge major test + lore narrative
      narrative: {
        paragraph1: "This is your current signal map from the Mini Suite.",
        paragraph2: "Next: we merge Major Test + archetype library to generate your legend narrative.",
        paragraph3: "When you’re ready, we’ll lock names, titles, and lore descriptions per aspect."
      }
    };

    return res.json({ ok: true, profileKey, finalResult });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to assemble results", error: e.message });
  }
}
