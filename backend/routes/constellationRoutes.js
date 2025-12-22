// backend/routes/constellationRoutes.js
import express from "express";

// ⭐ Star name (Mongo) — safe import: if file missing, we keep going
let StarProfile = null;
try {
  const mod = await import("../models/StarProfile.js");
  StarProfile = mod?.default || null;
} catch {
  StarProfile = null;
}

const router = express.Router();

/**
 * GET /api/constellation?profileKey=...
 *
 * Returns:
 * {
 *   ok: true,
 *   profileKey,
 *   meta: { source, suiteStatus, submissions },
 *   star: { id, type, name, luminary, shadow, signature },
 *   nodes: [{id,type,label,score,size,tag}],
 *   edges: [{from,to,weight}]
 * }
 *
 * This file is designed to be robust:
 * - If some models don’t exist yet, it still responds with a usable "stub" constellation.
 * - If MiniSuiteResult/Profile exist, it will build a real constellation from suite totals.
 */
router.get("/", async (req, res) => {
  try {
    const profileKey = String(req.query.profileKey || "").trim();
    if (!profileKey) {
      return res.status(400).json({ ok: false, message: "profileKey required" });
    }

    // ---------- Load star name (optional) ----------
    let starName = "";
    if (StarProfile) {
      try {
        const sp = await StarProfile.findOne({ profileKey }).lean();
        starName = (sp?.starName || "").trim();
      } catch {
        starName = "";
      }
    }

    // ---------- Try to resolve profileId from profileKey ----------
    let profile = null;
    let profileId = null;

    // We try a few common model names without crashing if they aren't present.
    // If none exist, we'll still return a stub constellation.
    const profileModelCandidates = [
      "../models/Profile.js",
      "../models/UserProfile.js",
      "../models/AccessProfile.js",
      "../models/User.js",
    ];

    for (const rel of profileModelCandidates) {
      try {
        const m = await import(rel);
        const Model = m?.default;
        if (!Model) continue;

        // Try common keys
        profile =
          (await Model.findOne({ profileKey }).lean()) ||
          (await Model.findOne({ key: profileKey }).lean()) ||
          (await Model.findOne({ slug: profileKey }).lean()) ||
          null;

        if (profile?._id) {
          profileId = profile._id;
          break;
        }
      } catch {
        // ignore
      }
    }

    // ---------- Try to load MiniSuiteResult (for luminaries/shadows) ----------
    let suite = null;
    let suiteStatus = null;
    let submissionsCount = 0;

    try {
      const mod = await import("../models/MiniSuiteResult.js");
      const MiniSuiteResult = mod?.default;

      if (MiniSuiteResult && profileId) {
        suite = await MiniSuiteResult.findOne({ profileId }).lean();
      }

      suiteStatus = suite?.suiteStatus || null;
      submissionsCount = Array.isArray(suite?.submissions) ? suite.submissions.length : 0;
    } catch {
      suite = null;
    }

    // Top lists can be stored in your schema already (you showed topLuminaries/topShadows earlier)
    const topLuminaries = Array.isArray(suite?.topLuminaries) ? suite.topLuminaries : [];
    const topShadows = Array.isArray(suite?.topShadows) ? suite.topShadows : [];

    const topLumTag = topLuminaries?.[0]?.tag || null;
    const topShaTag = topShadows?.[0]?.tag || null;

    const starSignature =
      topLumTag || topShaTag ? `${topLumTag || "?"} ✶ ${topShaTag || "?"}` : "";

    // ---------- Build nodes ----------
    const nodes = [];
    const edges = [];

    // Star core node
    nodes.push({
      id: "star_core",
      type: "star",
      label: starName || "Your Star",
      name: starName || "",
      luminary: topLumTag,
      shadow: topShaTag,
      signature: starSignature,
      size: 18,
      score: 0,
      tag: "star_core",
    });

    // Helper to add a node + edge to star
    const addNode = (n) => {
      if (!n?.id) return;
      nodes.push(n);
      edges.push({ from: "star_core", to: n.id, weight: 1 });
    };

    // Luminaries
    for (let i = 0; i < Math.min(5, topLuminaries.length); i++) {
      const item = topLuminaries[i] || {};
      const tag = item.tag || `lum_${i + 1}`;
      addNode({
        id: `lum_${tag}`,
        type: "luminary",
        label: item.name || tag,
        tag,
        score: typeof item.score === "number" ? item.score : item.value ?? null,
        size: 12 + (i === 0 ? 2 : 0),
      });
    }

    // Shadows
    for (let i = 0; i < Math.min(5, topShadows.length); i++) {
      const item = topShadows[i] || {};
      const tag = item.tag || `sha_${i + 1}`;
      addNode({
        id: `sha_${tag}`,
        type: "shadow",
        label: item.name || tag,
        tag,
        score: typeof item.score === "number" ? item.score : item.value ?? null,
        size: 12 + (i === 0 ? 2 : 0),
      });
    }

    // ---------- Optional: add archetype nodes if you have an archetype result model ----------
    // This is deliberately "best-effort" (won't crash if missing).
    // If your results store looks different, you can adjust later.
    try {
      const arModCandidates = [
        "../models/ArchetypeResult.js",
        "../models/ArchetypeResults.js",
        "../models/TestResult.js",
        "../models/Results.js",
      ];

      let ArchetypeModel = null;

      for (const rel of arModCandidates) {
        try {
          const m = await import(rel);
          if (m?.default) {
            ArchetypeModel = m.default;
            break;
          }
        } catch {
          // ignore
        }
      }

      if (ArchetypeModel && profileId) {
        // Try common shapes:
        // - { profileId, topArchetypes:[{tag,score,name}] }
        // - { profileId, results:{ topArchetypes:[] } }
        const latest =
          (await ArchetypeModel.findOne({ profileId }).sort({ createdAt: -1 }).lean()) ||
          (await ArchetypeModel.findOne({ profileId }).sort({ submittedAt: -1 }).lean()) ||
          null;

        const list =
          latest?.topArchetypes ||
          latest?.results?.topArchetypes ||
          latest?.results?.top ||
          [];

        if (Array.isArray(list) && list.length) {
          for (let i = 0; i < Math.min(6, list.length); i++) {
            const a = list[i] || {};
            const tag = a.tag || `arch_${i + 1}`;
            addNode({
              id: `arch_${tag}`,
              type: "archetype",
              label: a.name || tag,
              tag,
              score: typeof a.score === "number" ? a.score : a.value ?? null,
              size: 10,
            });
          }
        }
      }
    } catch {
      // ignore
    }

    // If we have no lum/shadow/archetype nodes, make a minimal visible constellation
    if (nodes.length === 1) {
      addNode({
        id: "hint_1",
        type: "archetype",
        label: "Run Mini Suite to generate nodes",
        tag: "hint",
        score: null,
        size: 10,
      });
    }

    const payload = {
      ok: true,
      profileKey,
      meta: {
        source: suite ? "mini_suite" : "stub",
        suiteStatus: suiteStatus || "unknown",
        submissions: submissionsCount,
      },
      star: {
        id: "star_core",
        type: "star",
        name: starName || "",
        luminary: topLumTag,
        shadow: topShaTag,
        signature: starSignature,
      },
      nodes,
      edges,
    };

    return res.json(payload);
  } catch (e) {
    console.error("constellationRoutes GET error:", e);
    return res.status(500).json({ ok: false, message: "Failed to build constellation" });
  }
});

// Quick check endpoint
router.get("/ping", (_req, res) => res.json({ ok: true, pong: true }));

export default router;
