// backend/controllers/resultController.js
import TestAttempt from "../models/TestAttempt.js";
import { assembleFinalResult } from "../lib/resultAssembler.js";

function safeObj(x) {
  return x && typeof x === "object" ? x : {};
}
function n(x) {
  const v = Number(x);
  return Number.isFinite(v) ? v : 0;
}
function s(x) {
  return String(x ?? "").trim();
}

function mergeNumberMaps(a = {}, b = {}) {
  const out = { ...safeObj(a) };
  for (const [k, v] of Object.entries(safeObj(b))) {
    out[k] = n(out[k]) + n(v);
  }
  return out;
}

async function latestSubmittedAttempt(profileKey, testId) {
  return await TestAttempt.findOne({
    profileKey,
    testId,
    status: "submitted",
  })
    .sort({ submittedAt: -1, createdAt: -1 })
    .lean();
}

/**
 * Mini suite aggregation:
 * - For each mini test id, take the latest submitted attempt
 * - Sum totals.luminary and totals.shadow across them
 */
async function aggregateMiniSuite(profileKey, miniIds) {
  let luminary = {};
  let shadow = {};

  const used = [];

  for (const id of miniIds) {
    const doc = await latestSubmittedAttempt(profileKey, id);
    if (!doc) continue;

    const t = safeObj(doc.totals);
    luminary = mergeNumberMaps(luminary, safeObj(t.luminary));
    shadow = mergeNumberMaps(shadow, safeObj(t.shadow));

    used.push({
      testId: id,
      submittedAt: doc.submittedAt || doc.createdAt,
      attemptId: doc.attemptId || String(doc._id),
    });
  }

  return { luminary, shadow, used };
}

export async function assembleResults(req, res) {
  try {
    const profileKey = s(req.query.profileKey) || "debug_profile";

    // ---- 1) MAJOR totals (latest submitted major_7day) ----
    const majorAttempt = await latestSubmittedAttempt(profileKey, "major_7day");
    const majorTotals = safeObj(majorAttempt?.totals?.major);

    // ---- 2) MINI totals (sum latest for each mini) ----
    const MINI_IDS = [
      "mini_lumi_shadow_01",
      "mini_lumi_shadow_02",
      "mini_lumi_shadow_03",
      "mini_lumi_shadow_04",
      "mini_lumi_shadow_05",
    ];

    const miniAgg = await aggregateMiniSuite(profileKey, MINI_IDS);
    const miniTotals = {
      luminary: miniAgg.luminary,
      shadow: miniAgg.shadow,
    };

    // ---- 3) ARCHETYPE totals (optional: if you later store archetype test totals as totals.archetype) ----
    // If you have a dedicated archetype test id, put it here.
    // For now: try "archetype_main" if it exists, else empty.
    const archetypeAttempt = await latestSubmittedAttempt(profileKey, "archetype_main");
    const archetypeTotals = safeObj(archetypeAttempt?.totals?.archetype);

    // ---- 4) Assemble final ----
    const finalResult = assembleFinalResult({
      profileKey,
      miniTotals,
      archetypeTotals,
      majorTotals,
    });

    return res.json({
      ok: true,
      profileKey,
      sources: {
        major: majorAttempt
          ? {
              testId: "major_7day",
              submittedAt: majorAttempt.submittedAt || majorAttempt.createdAt,
              attemptId: majorAttempt.attemptId || String(majorAttempt._id),
            }
          : null,
        miniUsed: miniAgg.used,
        archetype: archetypeAttempt
          ? {
              testId: "archetype_main",
              submittedAt: archetypeAttempt.submittedAt || archetypeAttempt.createdAt,
              attemptId: archetypeAttempt.attemptId || String(archetypeAttempt._id),
            }
          : null,
      },
      finalResult,
    });
  } catch (err) {
    console.error("assembleResults error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error assembling results",
    });
  }
}

/**
 * Convenience endpoint:
 * GET /api/results/latest?profileKey=...
 * For now, it simply re-assembles on demand and returns the finalResult.
 */
export async function latestResults(req, res) {
  return assembleResults(req, res);
}
