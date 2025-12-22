// backend/controllers/miniTestController.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BANK_PATH = path.join(__dirname, "..", "data", "miniTests.lumiShadow.v1.json");
const STORE_PATH = path.join(__dirname, "..", "data", "miniSuite.store.json");

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function writeJSON(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf8");
}
function ensureStore() {
  if (!fs.existsSync(STORE_PATH)) writeJSON(STORE_PATH, { ok: true, profiles: {} });
  return readJSON(STORE_PATH);
}

function asArray(v) {
  return Array.isArray(v) ? v : [];
}
function addScore(map, key, amt) {
  const n = Number(amt || 0);
  if (!key || !Number.isFinite(n)) return;
  map[key] = (map[key] || 0) + n;
}
function ensureObj(map, key) {
  if (!map[key] || typeof map[key] !== "object") map[key] = {};
  return map[key];
}

function applySignal(totals, signal, base = 1) {
  if (!signal) return;
  const weight = Number(signal.weight ?? 1);
  const w = Number.isFinite(weight) ? weight : 1;
  const score = Number(base || 0) * w;

  const tone = signal.tone || null;
  for (const c of asArray(signal.const)) {
    addScore(totals.const, c, score);
    if (tone) {
      const bucket = ensureObj(totals.constTone, c);
      addScore(bucket, tone, score);
    }
  }
  if (tone) addScore(totals.tone, tone, score);
}

function topN(obj, n = 5) {
  return Object.entries(obj || {})
    .map(([id, score]) => ({ id, score: Number(score || 0) }))
    .filter((x) => Number.isFinite(x.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

function buildIndex(bank) {
  const testById = new Map();
  for (const t of asArray(bank.tests)) testById.set(t.miniTestId, t);

  const questionById = new Map();
  for (const t of asArray(bank.tests)) {
    for (const q of asArray(t.questions)) questionById.set(q.id, q);
  }

  return { testById, questionById };
}

export function getMiniSuite(req, res) {
  try {
    const bank = readJSON(BANK_PATH);
    return res.json({ ok: true, suite: bank.suite, id: bank.id, title: bank.title, version: bank.version });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to load mini suite", error: e.message });
  }
}

export function getMiniTest(req, res) {
  try {
    const { miniTestId } = req.params;
    const bank = readJSON(BANK_PATH);
    const { testById } = buildIndex(bank);
    const t = testById.get(miniTestId);
    if (!t) return res.status(404).json({ ok: false, message: `miniTestId not found: ${miniTestId}` });
    return res.json({ ok: true, test: t, defaults: bank.defaults, suite: bank.suite });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to load mini test", error: e.message });
  }
}

export function submitMiniTest(req, res) {
  try {
    const { profileKey, miniTestId, answers } = req.body || {};
    if (!profileKey) return res.status(400).json({ ok: false, message: "profileKey is required" });
    if (!miniTestId) return res.status(400).json({ ok: false, message: "miniTestId is required" });

    const bank = readJSON(BANK_PATH);
    const { testById, questionById } = buildIndex(bank);
    const test = testById.get(miniTestId);
    if (!test) return res.status(404).json({ ok: false, message: `miniTestId not found: ${miniTestId}` });

    const defaults = bank.defaults || {};
    const choiceWeight = Number(defaults.choiceWeight ?? 2);
    const scale = defaults.scale || { min: 1, max: 7, neutral: 4 };

    const totals = { const: {}, tone: {}, constTone: {} };

    const normalized = asArray(answers).map((a) => ({
      questionId: a?.questionId,
      optionId: a?.optionId,
      optionIds: Array.isArray(a?.optionIds) ? a.optionIds : [],
      value: a?.value,
      completed: a?.completed === true || a?.value === true,
      text: a?.text,
      fileKey: a?.fileKey
    }));

    for (const a of normalized) {
      const q = questionById.get(a.questionId);
      if (!q) continue;

      if (q.type === "single") {
        const opt = asArray(q.options).find((o) => o.id === a.optionId);
        if (opt) applySignal(totals, opt.signal, choiceWeight);
        continue;
      }

      if (q.type === "multi") {
        const maxPicks = Number(q.maxPicks ?? defaults?.multi?.maxPicksDefault ?? 2);
        const picks = asArray(a.optionIds).slice(0, maxPicks);
        for (const pid of picks) {
          const opt = asArray(q.options).find((o) => o.id === pid);
          if (opt) applySignal(totals, opt.signal, choiceWeight);
        }
        continue;
      }

      if (q.type === "scale") {
        const v = Number(a.value);
        if (!Number.isFinite(v)) continue;
        const clamped = Math.max(scale.min, Math.min(scale.max, v));
        if (clamped < scale.neutral) applySignal(totals, q.anchors?.low?.signal, Math.abs(scale.neutral - clamped));
        if (clamped > scale.neutral) applySignal(totals, q.anchors?.high?.signal, Math.abs(clamped - scale.neutral));
        continue;
      }

      if (q.type === "rank") {
        // accept array order as a.value: ["A","B",...]
        const items = asArray(q.items);
        const n = items.length || 5;
        const order = Array.isArray(a.value) ? a.value : [];
        const rankOf = {};
        order.forEach((id, idx) => (rankOf[id] = idx + 1));

        for (const it of items) {
          const r = rankOf[it.id];
          if (!Number.isFinite(r)) continue;
          const pts = n - r + 1;
          const earned = (pts / n) * choiceWeight;
          const sig = q.rankSignals?.[it.id];
          if (sig) applySignal(totals, sig, earned);
        }
        continue;
      }

      if (q.type === "check") {
        if (a.completed) applySignal(totals, q.signal, 1);
        continue;
      }

      if (q.type === "text") {
        const hasText = typeof a.text === "string" && a.text.trim().length > 0;
        if (hasText && q.signal) applySignal(totals, q.signal, 1);
        continue;
      }

      if (q.type === "file") {
        const hasFile = typeof a.fileKey === "string" && a.fileKey.trim().length > 0;
        if (hasFile && q.signal) applySignal(totals, q.signal, 1);
        continue;
      }
    }

    // Store into suite store
    const store = ensureStore();
    const profiles = store.profiles || {};
    if (!profiles[profileKey]) {
      profiles[profileKey] = {
        profileKey,
        suiteStatus: "in_progress",
        submissions: [],
        totals: { const: {}, tone: {}, constTone: {} },
        updatedAt: Date.now()
      };
    }

    const prof = profiles[profileKey];

    // Replace submission if resubmitting same miniTestId
    prof.submissions = asArray(prof.submissions).filter((s) => s.miniTestId !== miniTestId);
    prof.submissions.push({ miniTestId, totals, submittedAt: new Date().toISOString() });

    // Re-aggregate suite totals
    const suiteTotals = { const: {}, tone: {}, constTone: {} };
    for (const sub of prof.submissions) {
      for (const [k, v] of Object.entries(sub?.totals?.const || {})) addScore(suiteTotals.const, k, v);
      for (const [k, v] of Object.entries(sub?.totals?.tone || {})) addScore(suiteTotals.tone, k, v);
      for (const [c, tones] of Object.entries(sub?.totals?.constTone || {})) {
        const bucket = ensureObj(suiteTotals.constTone, c);
        for (const [t, v] of Object.entries(tones || {})) addScore(bucket, t, v);
      }
    }

    prof.totals = suiteTotals;
    prof.updatedAt = Date.now();

    store.profiles = profiles;
    writeJSON(STORE_PATH, store);

    return res.json({
      ok: true,
      miniTestId,
      profileKey,
      totals,
      suite: {
        suiteStatus: prof.suiteStatus,
        submissions: prof.submissions,
        totals: prof.totals,
        topConstellations: topN(prof.totals.const, 10),
        topTones: topN(prof.totals.tone, 3)
      }
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to submit mini test", error: e.message });
  }
}

export function getMiniSuiteResults(req, res) {
  try {
    const profileKey = String(req.query.profileKey || "");
    if (!profileKey) return res.status(400).json({ ok: false, message: "profileKey query param is required" });

    const store = ensureStore();
    const prof = store?.profiles?.[profileKey];
    if (!prof) return res.json({ ok: true, profileKey, suiteStatus: "new", submissions: [], totals: { const: {}, tone: {}, constTone: {} } });

    return res.json({
      ok: true,
      profileKey,
      suiteStatus: prof.suiteStatus,
      submissions: prof.submissions || [],
      totals: prof.totals || { const: {}, tone: {}, constTone: {} },
      topConstellations: topN(prof.totals?.const, 10),
      topTones: topN(prof.totals?.tone, 3)
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to read mini suite results", error: e.message });
  }
}

export function finishMiniSuite(req, res) {
  try {
    const { profileKey } = req.body || {};
    if (!profileKey) return res.status(400).json({ ok: false, message: "profileKey is required" });

    const store = ensureStore();
    const prof = store?.profiles?.[profileKey];
    if (!prof) return res.status(404).json({ ok: false, message: "No suite started for this profileKey" });

    prof.suiteStatus = "finished";
    prof.updatedAt = Date.now();
    writeJSON(STORE_PATH, store);

    return res.json({ ok: true, profileKey, suiteStatus: prof.suiteStatus, totals: prof.totals });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to finish mini suite", error: e.message });
  }
}
