// backend/lib/resultAssembler.js
/**
 * ECRJR — Result Assembler (v1.5)
 * --------------------------------
 * - Major influences Archetype selection
 * - Generates topLuminaries + topShadows
 * - Magic resolves by:
 *     manual assignment -> fallback -> auto-assign
 * - Expands 20 abilities automatically
 */

import { MAJOR_TO_ARCHETYPE_MAP_V1 } from "../data/majorToArchetypeMap.v1.js";
import { expandMagicProfile } from "./magicEngine.js";
import { resolveArchetypeMagic, resolveLuminaryMagic, resolveShadowMagic } from "./magicAssignments.js";

function safeObj(o) { return o && typeof o === "object" ? o : {}; }
function num(x) { const n = Number(x); return Number.isFinite(n) ? n : 0; }
function clamp01(x) { const n = num(x); return Math.max(0, Math.min(1, n)); }
function clamp100(x) { const n = num(x); return Math.max(0, Math.min(100, n)); }

function sortTop(scoreObj = {}, topN = 5) {
  const obj = safeObj(scoreObj);
  return Object.entries(obj)
    .map(([tag, score]) => ({ tag, score: num(score) }))
    .filter((x) => Number.isFinite(x.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

export function normalizeTotals(totals = {}, targetMax = 100) {
  const obj = safeObj(totals);
  const entries = Object.entries(obj).map(([k, v]) => [k, num(v)]);
  if (!entries.length) return {};
  const maxVal = Math.max(...entries.map(([, v]) => v), 1);
  const out = {};
  for (const [k, v] of entries) out[k] = Math.round((v / maxVal) * targetMax);
  return out;
}

export function majorToArchetypeSignal(majorTotalsRaw = {}) {
  const majorNorm = normalizeTotals(safeObj(majorTotalsRaw), 100);
  const mapAll = safeObj(MAJOR_TO_ARCHETYPE_MAP_V1);

  const signal = {};
  for (const [majorKey, majorScore] of Object.entries(majorNorm)) {
    const map = safeObj(mapAll[majorKey]);
    if (!Object.keys(map).length) continue;
    for (const [archTag, weight] of Object.entries(map)) {
      const w = num(weight);
      if (w <= 0) continue;
      signal[archTag] = (signal[archTag] || 0) + num(majorScore) * w;
    }
  }
  for (const k of Object.keys(signal)) signal[k] = Math.round(clamp100(signal[k]));
  return { majorNorm, signal };
}

export function blendArchetypeScores({ baseScores = {}, majorSignal = {}, wBase = 0.75, wMajor = 0.25 } = {}) {
  const base = safeObj(baseScores);
  const major = safeObj(majorSignal);

  const WB = clamp01(wBase);
  const WM = clamp01(wMajor);

  const out = {};
  const keys = new Set([...Object.keys(base), ...Object.keys(major)]);
  for (const k of keys) {
    const blended = num(base[k]) * WB + num(major[k]) * WM;
    out[k] = Math.round(clamp100(blended));
  }
  return out;
}

export function assembleFinalResult({
  profileKey,
  miniTotals,
  archetypeTotals,
  majorTotals,
  version = "ECRJR.v1.5",
} = {}) {
  const createdAt = new Date().toISOString();

  const mini = safeObj(miniTotals);
  const luminaryTotals = safeObj(mini.luminary || {});
  const shadowTotals = safeObj(mini.shadow || {});
  const luminaryTotalsFallback =
    Object.keys(luminaryTotals).length === 0 ? safeObj(miniTotals) : luminaryTotals;

  const baseArchTotals = safeObj(archetypeTotals);

  // Archetype blend
  const { majorNorm, signal: majorSignal } = majorToArchetypeSignal(majorTotals || {});
  const archetypeTotalsBlended = blendArchetypeScores({
    baseScores: baseArchTotals,
    majorSignal,
    wBase: 0.75,
    wMajor: 0.25,
  });

  // Selections
  const topArchetypes = sortTop(archetypeTotalsBlended, 5);
  const topLuminaries = sortTop(luminaryTotalsFallback, 5);
  const topShadows = sortTop(shadowTotals, 5);

  const primaryArchetypeTag = topArchetypes?.[0]?.tag || null;
  const primaryLuminaryTag = topLuminaries?.[0]?.tag || null;
  const primaryShadowTag = topShadows?.[0]?.tag || null;

  // Magic resolution (manual -> fallback -> auto)
  const archetypeMagicProfile = primaryArchetypeTag
    ? resolveArchetypeMagic(primaryArchetypeTag)
    : resolveArchetypeMagic("unknown_archetype");

  const luminaryMagicProfile = primaryLuminaryTag
    ? resolveLuminaryMagic(primaryLuminaryTag)
    : resolveLuminaryMagic("unknown_luminary");

  const shadowMagicProfile = primaryShadowTag
    ? resolveShadowMagic(primaryShadowTag)
    : resolveShadowMagic("unknown_shadow");

  // Expand into 20 abilities + world + packs
  const archetypeMagic = expandMagicProfile(archetypeMagicProfile);
  const luminaryMagic = expandMagicProfile(luminaryMagicProfile);
  const shadowMagic = expandMagicProfile(shadowMagicProfile);

  // Debug
  console.log("TOP ARCHETYPE", primaryArchetypeTag, "->", archetypeMagicProfile);
  console.log("TOP LUMINARY", primaryLuminaryTag, "->", luminaryMagicProfile);
  console.log("TOP SHADOW", primaryShadowTag, "->", shadowMagicProfile);

  return {
    profileKey,
    createdAt,
    version,

    totals: {
      luminary: luminaryTotalsFallback,
      shadow: shadowTotals,
      archetypeBase: baseArchTotals,
      major: majorNorm,
      majorSignal,
      archetypeBlended: archetypeTotalsBlended,
    },

    selections: {
      topArchetypes,
      topLuminaries,
      topShadows,
      primary: {
        archetype: primaryArchetypeTag,
        luminary: primaryLuminaryTag,
        shadow: primaryShadowTag,
      },
    },

    magic: {
      archetype: archetypeMagic,
      luminary: luminaryMagic,
      shadow: shadowMagic,
    },

    provenance: {
      weights: { wBase: 0.75, wMajor: 0.25 },
      magicAutoAssign: true
    }
  };
}
