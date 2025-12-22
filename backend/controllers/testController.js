// backend/controllers/testController.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import TestAttempt from "../models/TestAttempt.js";

/**
 * Tests Controller (v5)
 * ---------------------
 * ✅ assignments upload-only for daily tests (day_X_assignments)
 * ✅ attemptId always generated to satisfy your existing UNIQUE index
 * ✅ supports:
 *   - GET  /api/tests/ping
 *   - GET  /api/tests/catalog
 *   - GET  /api/tests/:testId
 *   - POST /api/tests/start
 *   - POST /api/tests/submit
 *   - GET  /api/tests/results/:resultId   (resultId = attemptId)
 *   - GET  /api/tests/results/latest?profileKey=...&testId=...
 */

function safeArr(x) {
  return Array.isArray(x) ? x : [];
}
function safeObj(x) {
  return x && typeof x === "object" ? x : {};
}
function s(x) {
  return String(x ?? "").trim();
}
function num(x) {
  const v = Number(x);
  return Number.isFinite(v) ? v : 0;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BANK_DIR = path.join(__dirname, "..", "data");

// Update these filenames when your real banks exist.
// If a bank file is missing, getTestById falls back gracefully.
const BANKS = {
  major_7day: path.join(BANK_DIR, "majorTest.bank.v1.json"),
  mini_lumi_shadow_01: path.join(BANK_DIR, "miniTests.lumiShadow.v1.json"),
  // mini_lumi_shadow_02: path.join(BANK_DIR, "miniTests.lumiShadow02.v1.json"),
};

function readJsonIfExists(p) {
  try {
    if (!p || !fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    console.warn("⚠️ Failed to read JSON:", p, e?.message || e);
    return null;
  }
}

function makeTestCard(t) {
  return {
    id: s(t.id),
    title: s(t.title),
    description: s(t.description),
    kind: s(t.kind || "unknown"),
    days: t.days ?? null,
    totalQuestions: t.totalQuestions ?? null,
    totalAssignments: t.totalAssignments ?? null,
    routeHint: t.routeHint || null,
  };
}

// -----------------------------
// GET /api/tests/ping
// -----------------------------
export async function pingTests(req, res) {
  return res.json({
    ok: true,
    message: "tests router ok",
    routes: [
      "GET  /api/tests/ping",
      "GET  /api/tests/catalog",
      "GET  /api/tests/:testId",
      "POST /api/tests/start",
      "POST /api/tests/submit",
      "GET  /api/tests/results/:resultId",
      "GET  /api/tests/results/latest?profileKey=debug_profile&testId=major_7day",
    ],
  });
}

// -----------------------------
// GET /api/tests/catalog
// -----------------------------
export async function getTestCatalog(req, res) {
  try {
    const major = makeTestCard({
      id: "major_7day",
      title: "Major Test — 7 Day Suite",
      description: "7-day arc: daily questions + upload-only art assignments. Influences final result.",
      kind: "major",
      days: 7,
      totalQuestions: 105, // placeholder until bank is connected
      totalAssignments: 21,
      routeHint: "/api/major-test",
    });

    const minis = [
      makeTestCard({
        id: "mini_lumi_shadow_01",
        title: "Mini Test 1 — Luminary & Shadow (Core)",
        description: "Establishes base luminary/shadow totals.",
        kind: "mini",
        totalQuestions: 15,
        routeHint: "/api/mini-tests",
      }),
      makeTestCard({
        id: "mini_lumi_shadow_02",
        title: "Mini Test 2 — Luminary & Shadow (Impulse)",
        description: "Adds impulse + stress coloration.",
        kind: "mini",
        totalQuestions: 15,
        routeHint: "/api/mini-tests",
      }),
      makeTestCard({
        id: "mini_lumi_shadow_03",
        title: "Mini Test 3 — Luminary & Shadow (Values)",
        description: "Values-based weighting.",
        kind: "mini",
        totalQuestions: 15,
        routeHint: "/api/mini-tests",
      }),
      makeTestCard({
        id: "mini_lumi_shadow_04",
        title: "Mini Test 4 — Luminary & Shadow (Social)",
        description: "Relational + social traits.",
        kind: "mini",
        totalQuestions: 15,
        routeHint: "/api/mini-tests",
      }),
      makeTestCard({
        id: "mini_lumi_shadow_05",
        title: "Mini Test 5 — Luminary & Shadow (Shadow Pressure)",
        description: "Pressure testing patterns.",
        kind: "mini",
        totalQuestions: 15,
        routeHint: "/api/mini-tests",
      }),
    ];

    const daily = [];
    for (let day = 1; day <= 7; day++) {
      daily.push(
        makeTestCard({
          id: `day_${day}_assignments`,
          title: `Day ${day} — Upload Assignments`,
          description: "Upload-only art prompts (3 uploads). Scorable.",
          kind: "daily",
          days: 1,
          totalAssignments: 3,
          routeHint: "/api/major-test",
        })
      );
    }

    return res.json({ ok: true, tests: [major, ...minis, ...daily] });
  } catch (err) {
    console.error("getTestCatalog error:", err);
    return res.status(500).json({ ok: false, message: err?.message || "Server error" });
  }
}

// -----------------------------
// Helpers: daily upload-only assignments
// -----------------------------
function buildDailyUploadOnlyAssignments(testId) {
  return [
    {
      id: `${testId}_a1`,
      type: "upload",
      prompt: "Upload 1: Progress photo (today’s first attempt).",
      accept: ["image/*"],
      score: { major: { M_ART_DAILY: 2 } },
    },
    {
      id: `${testId}_a2`,
      type: "upload",
      prompt: "Upload 2: Study photo (color/value/gesture).",
      accept: ["image/*"],
      score: { major: { M_ART_DAILY: 2 } },
    },
    {
      id: `${testId}_a3`,
      type: "upload",
      prompt: "Upload 3: Best-of-day photo.",
      accept: ["image/*"],
      score: { major: { M_ART_DAILY: 1 } },
    },
  ];
}

// -----------------------------
// GET /api/tests/:testId
// -----------------------------
export async function getTestById(req, res) {
  try {
    const testId = s(req.params.testId);

    // Bank-backed test
    const bankPath = BANKS[testId];
    if (bankPath) {
      const bank = readJsonIfExists(bankPath);
      if (bank) {
        return res.json({
          ok: true,
          test: {
            id: testId,
            title: bank.title || testId,
            description: bank.description || "",
            kind: bank.kind || "bank",
            days: bank.days ?? null,
            questions: safeArr(bank.questions),
            assignments: safeArr(bank.assignments),
          },
        });
      }
    }

    // Daily upload-only assignment tests
    if (testId.startsWith("day_") && testId.endsWith("_assignments")) {
      const dayNum = testId.replace("day_", "").replace("_assignments", "");
      return res.json({
        ok: true,
        test: {
          id: testId,
          title: `Day ${dayNum} — Upload Assignments`,
          description: "Upload-only art prompts (3 uploads). Scorable.",
          kind: "daily",
          questions: [],
          assignments: buildDailyUploadOnlyAssignments(testId),
        },
      });
    }

    // Fallback test
    return res.json({
      ok: true,
      test: {
        id: testId,
        title: `Test: ${testId}`,
        description: "Placeholder test until bank is connected.",
        kind: "unknown",
        questions: [
          {
            id: "Q1",
            type: "multiple_choice",
            prompt: "Placeholder question: pick one.",
            options: [
              { id: "A", text: "Option A", score: { major: { M_PLACEHOLDER: 1 } } },
              { id: "B", text: "Option B", score: { major: { M_PLACEHOLDER: 2 } } },
              { id: "C", text: "Option C", score: { major: { M_PLACEHOLDER: 3 } } },
            ],
          },
        ],
        assignments: [],
      },
    });
  } catch (err) {
    console.error("getTestById error:", err);
    return res.status(500).json({ ok: false, message: err?.message || "Server error" });
  }
}

// -----------------------------
// Scoring engine
// -----------------------------
function ensureDomains(totals) {
  const out = safeObj(totals);
  for (const d of ["major", "luminary", "shadow", "archetype"]) {
    if (!out[d] || typeof out[d] !== "object") out[d] = {};
  }
  return out;
}

function addTotals(base, deltaScoreObj) {
  const totals = ensureDomains(base);
  const delta = safeObj(deltaScoreObj);

  for (const domain of ["major", "luminary", "shadow", "archetype"]) {
    const src = safeObj(delta[domain]);
    for (const [k, v] of Object.entries(src)) {
      totals[domain][k] = (totals[domain][k] || 0) + num(v);
    }
  }
  return totals;
}

function mergeTotals(a, b) {
  const out = ensureDomains({});
  addTotals(out, a);
  addTotals(out, b);
  return out;
}

function hasAnyAnswer(val) {
  const v = safeObj(val);
  if (v.optionId != null && String(v.optionId).length) return true;
  if (Array.isArray(v.optionIds) && v.optionIds.length) return true;
  if (typeof v.text === "string" && v.text.trim().length) return true;
  if (typeof v.value === "number" && Number.isFinite(v.value)) return true;
  if (v.fileName) return true;
  return false;
}

function scoreFromItemAndAnswer(item, ansVal) {
  const totals = ensureDomains({});
  if (!hasAnyAnswer(ansVal)) return totals;

  // baseline on item (perfect for upload assignments)
  if (item.score) addTotals(totals, item.score);

  const type = s(item.type || "text");
  const val = safeObj(ansVal);

  if (type === "multiple_choice") {
    const optId = s(val.optionId);
    const opt = safeArr(item.options).find((o) => s(o.id) === optId);
    if (opt?.score) addTotals(totals, opt.score);
  }

  if (type === "select_multiple") {
    const ids = new Set(safeArr(val.optionIds).map((x) => s(x)));
    for (const opt of safeArr(item.options)) {
      if (ids.has(s(opt.id)) && opt?.score) addTotals(totals, opt.score);
    }
  }

  if (type === "rating") {
    const map = safeObj(item.ratingScoreMap);
    const key = String(val.value ?? "");
    if (map[key]) addTotals(totals, map[key]);
  }

  return totals;
}

function flattenItemsFromTestDef(testDef) {
  const t = safeObj(testDef);
  const merged = [...safeArr(t.questions), ...safeArr(t.assignments)].map((it, i) => ({
    ...it,
    id: s(it.id) || `item_${i + 1}`,
    type: s(it.type || "text"),
  }));
  return merged;
}

// -----------------------------
// POST /api/tests/start
// -----------------------------
export async function startTest(req, res) {
  try {
    const profileKey = s(req.body?.profileKey) || "debug_profile";
    const testId = s(req.body?.testId);
    if (!testId) return res.status(400).json({ ok: false, message: "Missing testId" });

    // ✅ Always set attemptId (unique index safety)
    const attemptId = crypto.randomUUID();

    const doc = await TestAttempt.create({
      attemptId,
      profileKey,
      testId,
      status: "started",
      answers: [],
      totals: ensureDomains({}),
      startedAt: new Date(),
      submittedAt: null,
    });

    return res.json({ ok: true, attemptId: doc.attemptId });
  } catch (err) {
    console.error("startTest error:", err);
    return res.status(500).json({ ok: false, message: err?.message || "Server error" });
  }
}

// -----------------------------
// POST /api/tests/submit
// -----------------------------
export async function submitTest(req, res) {
  try {
    const profileKey = s(req.body?.profileKey) || "debug_profile";
    const testId = s(req.body?.testId);
    const answersMap = safeObj(req.body?.answers);

    if (!testId) return res.status(400).json({ ok: false, message: "Missing testId" });

    // Load scoring definition for this test (bank or daily placeholder)
    let testDef = null;

    const bankPath = BANKS[testId];
    if (bankPath) {
      const bank = readJsonIfExists(bankPath);
      if (bank) testDef = { questions: safeArr(bank.questions), assignments: safeArr(bank.assignments) };
    }

    if (!testDef && testId.startsWith("day_") && testId.endsWith("_assignments")) {
      testDef = { questions: [], assignments: buildDailyUploadOnlyAssignments(testId) };
    }

    if (!testDef) {
      testDef = { questions: [], assignments: [] };
    }

    const items = flattenItemsFromTestDef(testDef);

    let totals = ensureDomains({});
    const answersArray = [];

    for (const it of items) {
      const itemId = s(it.id);
      if (!(itemId in answersMap)) continue;

      const val = answersMap[itemId];
      answersArray.push({ itemId, value: val });

      const delta = scoreFromItemAndAnswer(it, val);
      totals = mergeTotals(totals, delta);
    }

    // ✅ Always set attemptId (unique index safety)
    const attemptId = crypto.randomUUID();

    const doc = await TestAttempt.create({
      attemptId,
      profileKey,
      testId,
      status: "submitted",
      answers: answersArray,
      totals,
      startedAt: new Date(),
      submittedAt: new Date(),
    });

    return res.json({
      ok: true,
      attemptId: doc.attemptId,
      resultId: doc.attemptId, // treat resultId as attemptId
      totals: doc.totals,
    });
  } catch (err) {
    console.error("submitTest error:", err);
    return res.status(500).json({ ok: false, message: err?.message || "Server error" });
  }
}

// -----------------------------
// GET /api/tests/results/:resultId
// -----------------------------
export async function getTestResult(req, res) {
  try {
    const resultId = s(req.params.resultId);
    const doc = await TestAttempt.findOne({ attemptId: resultId }).lean();
    if (!doc) return res.status(404).json({ ok: false, message: "Result not found" });
    return res.json({ ok: true, result: doc });
  } catch (err) {
    console.error("getTestResult error:", err);
    return res.status(500).json({ ok: false, message: err?.message || "Server error" });
  }
}

// -----------------------------
// GET /api/tests/results/latest?profileKey=...&testId=...
// -----------------------------
export async function getLatestTestResult(req, res) {
  try {
    const profileKey = s(req.query.profileKey) || "debug_profile";
    const testId = s(req.query.testId);
    if (!testId) return res.status(400).json({ ok: false, message: "Missing testId query param" });

    const doc = await TestAttempt.findOne({ profileKey, testId, status: "submitted" })
      .sort({ submittedAt: -1, createdAt: -1 })
      .lean();

    return res.json({ ok: true, result: doc || null });
  } catch (err) {
    console.error("getLatestTestResult error:", err);
    return res.status(500).json({ ok: false, message: err?.message || "Server error" });
  }
}
