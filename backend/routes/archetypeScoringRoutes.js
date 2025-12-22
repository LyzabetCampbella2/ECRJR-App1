// backend/routes/archetypeScoringRoutes.js
import express from "express";
import fs from "fs";
import path from "path";
import Archetype from "../models/Archetype.js";
import ArchetypeResult from "../models/ArchetypeResult.js";

const router = express.Router();

/* ---------------- helpers ---------------- */

function safeNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function clamp(n, lo, hi) {
  const x = Number(n);
  if (!Number.isFinite(x)) return lo;
  return Math.max(lo, Math.min(hi, x));
}

function cosineSimilarity(a, b) {
  const keys = Object.keys(a);
  let dot = 0;
  let na = 0;
  let nb = 0;

  for (const k of keys) {
    const x = Number(a[k]) || 0;
    const y = Number(b[k]) || 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }

  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function loadArchetypeBank() {
  const file = path.resolve(process.cwd(), "data", "testBanks", "archetypeTest.bank.json");
  if (!fs.existsSync(file)) {
    const err = new Error(`Test bank file missing: ${file}`);
    err.code = "BANK_MISSING";
    throw err;
  }
  const raw = fs.readFileSync(file, "utf8");
  if (!raw || !raw.trim()) {
    const err = new Error(`Test bank file is empty: ${file}`);
    err.code = "BANK_EMPTY";
    throw err;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    const err = new Error(`Invalid JSON in test bank: ${e.message}`);
    err.code = "BANK_INVALID_JSON";
    throw err;
  }
}

const DIMS = [
  "verificationNeed",
  "ambiguityTolerance",
  "decisionLatency",
  "systemsThinking",
  "authorityPosture",
  "noveltyDrive",
  "careOrientation",
  "structurePreference"
];

function buildUserVectorFromAnswers(questions, answers) {
  // answers: array of 0..4, same order as questions
  const vec = {};
  for (const d of DIMS) vec[d] = 0;

  const count = Math.min(questions.length, answers.length);

  for (let i = 0; i < count; i++) {
    const q = questions[i] || {};
    const ans = clamp(safeNum(answers[i]), 0, 4);
    const centered = (ans - 2) / 2; // -> [-1..1]
    const signed = q.reverse ? -centered : centered;

    const dim = q.dim;
    if (dim && vec[dim] !== undefined) {
      vec[dim] += signed;
    } else {
      // fallback if question has no dim
      vec.systemsThinking += signed * 0.25;
      vec.verificationNeed += signed * 0.25;
      vec.ambiguityTolerance += signed * 0.15;
      vec.structurePreference += signed * 0.20;
      vec.careOrientation += signed * 0.15;
    }
  }

  // normalize
  const denom = Math.max(1, count / 8);
  for (const k of Object.keys(vec)) {
    vec[k] = clamp(Number((vec[k] / denom).toFixed(3)), -1, 1);
  }

  return vec;
}

function pickSphere(userVec) {
  // heuristic gate-1, stable & fast
  const scores = {
    cognitive: 0,
    relational: 0,
    agentic: 0,
    creative: 0,
    integrative: 0
  };

  scores.cognitive += userVec.verificationNeed * 0.9 + userVec.structurePreference * 0.6;
  scores.relational += userVec.careOrientation * 1.0 + userVec.ambiguityTolerance * 0.2;
  scores.agentic += userVec.authorityPosture * 1.0 + (-userVec.decisionLatency) * 0.4;
  scores.creative += userVec.noveltyDrive * 1.0 + userVec.ambiguityTolerance * 0.6;
  scores.integrative += userVec.systemsThinking * 1.0 + userVec.ambiguityTolerance * 0.3;

  let best = "cognitive";
  let bestScore = -Infinity;
  for (const [k, v] of Object.entries(scores)) {
    if (v > bestScore) {
      bestScore = v;
      best = k;
    }
  }

  return { sphereId: best, sphereScores: scores };
}

const familiesBySphere = {
  cognitive: ["family_translators", "family_analysts", "family_architects", "family_archivists", "family_cartographers"],
  relational: ["family_harmonizers", "family_caretakers", "family_diplomats", "family_binders", "family_mirrors"],
  agentic: ["family_commanders", "family_executors", "family_pathfinders", "family_guardians", "family_challengers"],
  creative: ["family_storyweavers", "family_originators", "family_alchemists", "family_oracles", "family_curators"],
  integrative: ["family_synthesists", "family_stewards", "family_mediators", "family_signalers", "family_weavers"]
};

// Must match your generator’s baselines (used for gate-2 family pick)
const familyBase = {
  family_translators: { verificationNeed: 0.7, ambiguityTolerance: -0.2, decisionLatency: 0.4, systemsThinking: 0.5, authorityPosture: 0.1, noveltyDrive: 0.1, careOrientation: 0.2, structurePreference: 0.3 },
  family_analysts: { verificationNeed: 0.9, ambiguityTolerance: -0.1, decisionLatency: 0.7, systemsThinking: 0.6, authorityPosture: 0.0, noveltyDrive: -0.2, careOrientation: 0.0, structurePreference: 0.7 },
  family_architects: { verificationNeed: 0.6, ambiguityTolerance: 0.2, decisionLatency: 0.5, systemsThinking: 0.9, authorityPosture: 0.2, noveltyDrive: 0.1, careOrientation: 0.0, structurePreference: 0.9 },
  family_archivists: { verificationNeed: 0.8, ambiguityTolerance: -0.2, decisionLatency: 0.6, systemsThinking: 0.4, authorityPosture: 0.0, noveltyDrive: -0.3, careOrientation: 0.1, structurePreference: 0.8 },
  family_cartographers: { verificationNeed: 0.6, ambiguityTolerance: 0.4, decisionLatency: 0.7, systemsThinking: 0.8, authorityPosture: 0.0, noveltyDrive: 0.2, careOrientation: 0.0, structurePreference: 0.5 },

  family_harmonizers: { verificationNeed: 0.2, ambiguityTolerance: 0.4, decisionLatency: 0.2, systemsThinking: 0.2, authorityPosture: -0.3, noveltyDrive: 0.0, careOrientation: 0.8, structurePreference: 0.0 },
  family_caretakers: { verificationNeed: 0.3, ambiguityTolerance: 0.2, decisionLatency: 0.1, systemsThinking: 0.3, authorityPosture: -0.2, noveltyDrive: -0.1, careOrientation: 0.9, structurePreference: 0.2 },
  family_diplomats: { verificationNeed: 0.4, ambiguityTolerance: 0.6, decisionLatency: 0.5, systemsThinking: 0.4, authorityPosture: -0.1, noveltyDrive: 0.1, careOrientation: 0.6, structurePreference: 0.1 },
  family_binders: { verificationNeed: 0.2, ambiguityTolerance: 0.3, decisionLatency: 0.2, systemsThinking: 0.2, authorityPosture: 0.0, noveltyDrive: 0.0, careOrientation: 0.8, structurePreference: 0.2 },
  family_mirrors: { verificationNeed: 0.3, ambiguityTolerance: 0.7, decisionLatency: 0.6, systemsThinking: 0.3, authorityPosture: -0.2, noveltyDrive: 0.1, careOrientation: 0.7, structurePreference: -0.1 },

  family_commanders: { verificationNeed: 0.2, ambiguityTolerance: -0.2, decisionLatency: -0.4, systemsThinking: 0.3, authorityPosture: 0.8, noveltyDrive: 0.0, careOrientation: -0.1, structurePreference: 0.4 },
  family_executors: { verificationNeed: 0.2, ambiguityTolerance: -0.1, decisionLatency: -0.2, systemsThinking: 0.4, authorityPosture: 0.5, noveltyDrive: -0.1, careOrientation: 0.0, structurePreference: 0.6 },
  family_pathfinders: { verificationNeed: 0.3, ambiguityTolerance: 0.6, decisionLatency: -0.2, systemsThinking: 0.5, authorityPosture: 0.3, noveltyDrive: 0.4, careOrientation: 0.0, structurePreference: 0.0 },
  family_guardians: { verificationNeed: 0.6, ambiguityTolerance: -0.4, decisionLatency: -0.1, systemsThinking: 0.3, authorityPosture: 0.6, noveltyDrive: -0.2, careOrientation: 0.2, structurePreference: 0.9 },
  family_challengers: { verificationNeed: 0.2, ambiguityTolerance: 0.2, decisionLatency: -0.3, systemsThinking: 0.4, authorityPosture: 0.4, noveltyDrive: 0.3, careOrientation: -0.1, structurePreference: -0.1 },

  family_storyweavers: { verificationNeed: 0.1, ambiguityTolerance: 0.7, decisionLatency: 0.2, systemsThinking: 0.4, authorityPosture: -0.1, noveltyDrive: 0.8, careOrientation: 0.2, structurePreference: -0.2 },
  family_originators: { verificationNeed: 0.0, ambiguityTolerance: 0.6, decisionLatency: -0.2, systemsThinking: 0.3, authorityPosture: 0.1, noveltyDrive: 0.9, careOrientation: 0.0, structurePreference: -0.3 },
  family_alchemists: { verificationNeed: 0.2, ambiguityTolerance: 0.8, decisionLatency: 0.1, systemsThinking: 0.5, authorityPosture: -0.1, noveltyDrive: 0.8, careOrientation: 0.1, structurePreference: -0.2 },
  family_oracles: { verificationNeed: 0.2, ambiguityTolerance: 0.9, decisionLatency: 0.7, systemsThinking: 0.6, authorityPosture: -0.2, noveltyDrive: 0.6, careOrientation: 0.1, structurePreference: -0.3 },
  family_curators: { verificationNeed: 0.5, ambiguityTolerance: 0.3, decisionLatency: 0.3, systemsThinking: 0.4, authorityPosture: 0.0, noveltyDrive: 0.6, careOrientation: 0.1, structurePreference: 0.4 },

  family_synthesists: { verificationNeed: 0.5, ambiguityTolerance: 0.6, decisionLatency: 0.6, systemsThinking: 0.9, authorityPosture: 0.0, noveltyDrive: 0.3, careOrientation: 0.1, structurePreference: 0.3 },
  family_stewards: { verificationNeed: 0.6, ambiguityTolerance: 0.4, decisionLatency: 0.4, systemsThinking: 0.8, authorityPosture: 0.2, noveltyDrive: 0.0, careOrientation: 0.6, structurePreference: 0.6 },
  family_mediators: { verificationNeed: 0.5, ambiguityTolerance: 0.8, decisionLatency: 0.7, systemsThinking: 0.6, authorityPosture: -0.2, noveltyDrive: 0.2, careOrientation: 0.5, structurePreference: 0.0 },
  family_signalers: { verificationNeed: 0.6, ambiguityTolerance: 0.7, decisionLatency: 0.6, systemsThinking: 0.7, authorityPosture: -0.1, noveltyDrive: 0.2, careOrientation: 0.3, structurePreference: 0.1 },
  family_weavers: { verificationNeed: 0.3, ambiguityTolerance: 0.7, decisionLatency: 0.5, systemsThinking: 0.8, authorityPosture: -0.1, noveltyDrive: 0.4, careOrientation: 0.4, structurePreference: 0.0 }
};

function pickFamilyInSphere(sphereId, userVec) {
  const candidates = familiesBySphere[sphereId] || [];
  if (!candidates.length) {
    return { familyId: "family_translators", familyScores: {} };
  }

  let bestId = candidates[0];
  let bestScore = -Infinity;
  const familyScores = {};

  for (const famId of candidates) {
    const base = familyBase[famId];
    const score = base ? cosineSimilarity(userVec, base) : -1;
    familyScores[famId] = Number(score.toFixed(4));
    if (score > bestScore) {
      bestScore = score;
      bestId = famId;
    }
  }

  return { familyId: bestId, familyScores };
}

async function pickArchetypeInFamily(familyId, userVec) {
  const docs = await Archetype.find({ "family.id": familyId })
    .select("id name code sphere family vector oneLine")
    .lean();

  if (!docs.length) throw new Error(`No archetypes found for family ${familyId}`);

  let best = docs[0];
  let bestScore = -Infinity;

  for (const a of docs) {
    const sig = a?.vector?.gate3Signature;
    if (!sig) continue;
    const score = cosineSimilarity(userVec, sig);
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }

  return { archetype: best, matchScore: Number(bestScore.toFixed(4)) };
}

/* ---------------- routes ---------------- */

// POST /api/tests/archetype/submit
router.post("/submit", async (req, res) => {
  try {
    const { answers, profileId, profileKey } = req.body || {};

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ ok: false, message: "answers[] required (array of 0..4 values)" });
    }

    const bank = loadArchetypeBank();
    const questions = Array.isArray(bank?.questions) ? bank.questions : [];

    if (!questions.length) {
      return res.status(500).json({ ok: false, message: "Bank has no questions" });
    }

    const userVec = buildUserVectorFromAnswers(questions, answers);

    // Gate 1
    const { sphereId, sphereScores } = pickSphere(userVec);

    // Gate 2
    const { familyId, familyScores } = pickFamilyInSphere(sphereId, userVec);

    // Gate 3
    const { archetype, matchScore } = await pickArchetypeInFamily(familyId, userVec);

    // Persist result (do not break response if save fails)
    try {
      await ArchetypeResult.create({
        profileId: profileId || undefined,
        profileKey: profileKey || undefined,
        testId: bank.testId || bank.id || "archetype_main",
        archetypeId: archetype.id,
        sphereId,
        familyId,
        matchScore,
        answers,
        userVec
      });
    } catch (e) {
      console.warn("⚠️ ArchetypeResult save failed (continuing):", e?.message || e);
    }

    return res.json({
      ok: true,
      testId: bank.testId || bank.id || "archetype_main",
      sphereId,
      familyId,
      archetypeId: archetype.id,
      archetypeName: archetype.name,
      matchScore,
      debug: {
        userVec,
        sphereScores,
        familyScores
      }
    });
  } catch (e) {
    console.error("❌ archetype submit failed:", e);
    res.status(500).json({ ok: false, message: "Server error", error: e?.message || String(e) });
  }
});

export default router;
