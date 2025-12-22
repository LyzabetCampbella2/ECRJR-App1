// backend/controllers/majorTestController.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getConstellationEntry } from "../lib/constellationLibrary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BANK_PATH = path.join(__dirname, "..", "data", "majorTest.bank.json");

// -------------------------
// Helpers
// -------------------------
function safeReadJSON(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function asArray(v) {
  return Array.isArray(v) ? v : [];
}

function addScore(map, key, amount) {
  if (!key) return;
  const n = Number(amount || 0);
  if (!Number.isFinite(n)) return;
  map[key] = (map[key] || 0) + n;
}

function ensureObj(map, key) {
  if (!map[key] || typeof map[key] !== "object") map[key] = {};
  return map[key];
}

function applySignal(totals, signal, baseScore = 1, fallbackWeight = 1) {
  if (!signal || typeof signal !== "object") return;

  const weight = Number(signal.weight ?? fallbackWeight ?? 1);
  const w = Number.isFinite(weight) ? weight : 1;
  const score = Number(baseScore || 0) * w;

  const tone = signal.tone || null;

  for (const c of asArray(signal.const)) {
    addScore(totals.const, c, score);

    // Track tone per constellation too (for luminaries/shadows derivation)
    if (tone) {
      const bucket = ensureObj(totals.constTone, c);
      addScore(bucket, tone, score);
    }
  }

  if (tone) addScore(totals.tone, tone, score);
}

function normalizeAnswer(a) {
  return {
    questionId: a?.questionId,
    optionId: a?.optionId,
    optionIds: Array.isArray(a?.optionIds) ? a.optionIds : Array.isArray(a?.value) ? a.value : [],
    value: a?.value,
    ranks: a?.ranks,
    completed: typeof a?.completed === "boolean" ? a.completed : a?.value === true,
    text: a?.text ?? (typeof a?.value === "string" ? a.value : undefined),
    fileKey: a?.fileKey ?? (typeof a?.value === "string" ? a.value : undefined),
  };
}

function buildIndex(bank) {
  const byId = new Map();

  for (const q of asArray(bank.questions)) byId.set(q.id, q);

  const progDays = asArray(bank?.programs?.sevenDay?.days);
  for (const d of progDays) {
    for (const a of asArray(d.assignments)) {
      byId.set(a.id, { ...a, __isAssignment: true, day: d.day, theme: d.theme });
    }
  }

  return byId;
}

function topN(obj, n = 5) {
  return Object.entries(obj || {})
    .map(([id, score]) => ({ id, score: Number(score || 0) }))
    .filter((x) => Number.isFinite(x.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

function sumObj(obj) {
  return Object.values(obj || {}).reduce((acc, v) => acc + (Number(v) || 0), 0);
}

function deterministicName(seed) {
  const A = ["Rave", "Ech", "Vel", "Noct", "Sol", "Astra", "Ver", "Cael", "Myth", "Cyr"];
  const B = ["li", "ra", "en", "ory", "una", "ith", "ara", "ely", "eon", "ryn"];
  const C = ["quar", "lune", "mire", "thorn", "veil", "crown", "glass", "harrow", "spire", "ember"];

  let h = 2166136261;
  const s = String(seed || "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h = Math.abs(h);

  return `${A[h % A.length]}${B[(h >> 3) % B.length]}-${C[(h >> 7) % C.length]}`;
}

function buildAxes(luminaries, shadows) {
  const axes = [];
  const n = Math.min(5, luminaries.length, shadows.length);
  for (let i = 0; i < n; i++) {
    axes.push({
      axis: i + 1,
      luminary: luminaries[i],
      shadow: shadows[i],
      integration: `Hold ${luminaries[i].name} without slipping into ${shadows[i].name}.`,
    });
  }
  return axes;
}

function buildLegend({ profileKey, topLum, topShd, topConst }) {
  const core = topLum[0] ? `${topLum[0].name}` : "your leading luminary";
  const tension = topShd[0] ? `${topShd[0].name}` : "your leading shadow";
  const c1 = topConst[0]?.id || "C12";
  const c2 = topConst[1]?.id || "C02";

  const p1 =
    `Your constellation field tilts toward ${core}: the part of you that can refine chaos into something intentional. ` +
    `When you are steady, you choose what stays true, you edit what distracts, and you build a life that feels precise rather than loud.`;

  const p2 =
    `Your pressure-pattern shows up as ${tension}. This is not “bad”—it is signal. ` +
    `It usually appears when you feel exposed, rushed, or forced to perform without enough time to make it clean. ` +
    `In those moments, the nervous system tries to reclaim control through extremes.`;

  const p3 =
    `Your integration path is simple and difficult: return to craft. ` +
    `Let ${c1} and ${c2} be your anchors—small daily practice, clear standards, and a gentle refusal to overreact. ` +
    `If you can stay with the work long enough to finish, you turn intensity into refinement.`;

  return { paragraphs: [p1, p2, p3] };
}

// -------------------------
// GET /api/major-test/bank
// -------------------------
export function getMajorTestBank(req, res) {
  try {
    const bank = safeReadJSON(BANK_PATH);
    return res.json({ ok: true, bank });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Failed to load major test bank",
      error: err?.message || String(err),
    });
  }
}

// -------------------------
// POST /api/major-test/submit
// Body: { profileKey, answers: [...], meta?: { bestOfFileKey?: string } }
// -------------------------
export function submitMajorTest(req, res) {
  try {
    const { profileKey, answers, meta } = req.body || {};
    if (!profileKey) return res.status(400).json({ ok: false, message: "profileKey is required" });

    const bank = safeReadJSON(BANK_PATH);
    const index = buildIndex(bank);

    const totals = {
      const: {},
      tone: {},
      constTone: {}, // constellation -> { lum/mix/shd }
    };

    const perDay = {}; // day -> { earned, possible }
    const normalized = asArray(answers).map(normalizeAnswer);

    const gallery = []; // extracted uploads

    const defaults = bank?.defaults || {};
    const choiceWeight = Number(defaults.choiceWeight ?? 2);
    const scaleMin = Number(defaults?.scale?.min ?? 1);
    const scaleMax = Number(defaults?.scale?.max ?? 7);
    const scaleNeutral = Number(defaults?.scale?.neutral ?? 4);

    for (const a of normalized) {
      const q = index.get(a.questionId);
      if (!q) continue;

      const dayKey = Number(q.day || 0) || 0;
      if (!perDay[dayKey]) perDay[dayKey] = { earned: 0, possible: 0 };

      // SINGLE
      if (q.type === "single") {
        perDay[dayKey].possible += choiceWeight;
        const picked = typeof a.optionId === "number" ? a.optionId : a.value;
        const opt = asArray(q.options).find((o) => o.id === picked);
        if (!opt) continue;
        perDay[dayKey].earned += choiceWeight;
        applySignal(totals, opt.signal, choiceWeight, 1);
        continue;
      }

      // MULTI
      if (q.type === "multi") {
        const maxPicks = Number(q.maxPicks ?? defaults?.multi?.maxPicksDefault ?? 2);
        const pickWeight = choiceWeight;
        perDay[dayKey].possible += maxPicks * pickWeight;

        const picks = asArray(a.optionIds).slice(0, maxPicks);
        for (const pid of picks) {
          const opt = asArray(q.options).find((o) => o.id === pid);
          if (!opt) continue;
          perDay[dayKey].earned += pickWeight;
          applySignal(totals, opt.signal, pickWeight, 1);
        }
        continue;
      }

      // SCALE
      if (q.type === "scale") {
        perDay[dayKey].possible += choiceWeight;

        const vRaw = Number(a.value);
        if (!Number.isFinite(vRaw)) continue;

        const v = Math.max(scaleMin, Math.min(scaleMax, vRaw));
        const spanLow = Math.max(1, scaleNeutral - scaleMin);
        const spanHigh = Math.max(1, scaleMax - scaleNeutral);

        let intensity = 0;
        if (v < scaleNeutral) intensity = (scaleNeutral - v) / spanLow;
        else if (v > scaleNeutral) intensity = (v - scaleNeutral) / spanHigh;

        const earned = Math.round(choiceWeight * intensity * 100) / 100;
        perDay[dayKey].earned += earned;

        if (v < scaleNeutral) applySignal(totals, q.anchors?.low?.signal, earned, 1);
        if (v > scaleNeutral) applySignal(totals, q.anchors?.high?.signal, earned, 1);
        continue;
      }

      // RANK
      if (q.type === "rank") {
        const items = asArray(q.items);
        const n = items.length || 5;
        perDay[dayKey].possible += choiceWeight;

        const ranksMap = {};

        if (Array.isArray(a.ranks)) {
          for (const r of a.ranks) {
            if (r?.id && Number.isFinite(Number(r.rank))) ranksMap[r.id] = Number(r.rank);
          }
        } else if (a.value && typeof a.value === "object" && !Array.isArray(a.value)) {
          for (const [k, v] of Object.entries(a.value)) {
            if (Number.isFinite(Number(v))) ranksMap[k] = Number(v);
          }
        } else if (Array.isArray(a.value)) {
          a.value.forEach((id, idx) => (ranksMap[id] = idx + 1));
        }

        for (const it of items) {
          const r = ranksMap[it.id];
          if (!Number.isFinite(r)) continue;
          const rank = Math.max(1, Math.min(n, r));
          const pts = n - rank + 1; // high rank -> higher pts
          const earned = (pts / n) * choiceWeight;
          perDay[dayKey].earned += earned;

          const sig = q.rankSignals?.[it.id];
          if (sig) applySignal(totals, sig, earned, 1);
        }
        continue;
      }

      // CHECK
      if (q.type === "check") {
        perDay[dayKey].possible += 1;
        if (a.completed === true) {
          perDay[dayKey].earned += 1;
          applySignal(totals, q.signal, 1, 1);
        }
        continue;
      }

      // TEXT (scored only if q.signal exists)
      if (q.type === "text") {
        const hasText = typeof a.text === "string" && a.text.trim().length > 0;
        if (q.signal) {
          perDay[dayKey].possible += 1;
          if (hasText) {
            perDay[dayKey].earned += 1;
            applySignal(totals, q.signal, 1, 1);
          }
        }
        continue;
      }

      // FILE (scored only if q.signal exists)
      if (q.type === "file") {
        const hasFile = typeof a.fileKey === "string" && a.fileKey.trim().length > 0;
        if (q.signal) {
          perDay[dayKey].possible += 1;
          if (hasFile) {
            perDay[dayKey].earned += 1;
            applySignal(totals, q.signal, 1, 1);
          }
        }

        if (hasFile) {
          gallery.push({
            questionId: q.id,
            day: dayKey,
            theme: q.theme || bank?.majorSchedule?.days?.find((d) => d.day === dayKey)?.title || "",
            fileKey: a.fileKey,
            url: `/uploads/${encodeURIComponent(a.fileKey)}`,
            category: q.category || "",
            prompt: q.prompt || "",
            isAssignment: q.__isAssignment === true,
          });
        }
        continue;
      }
    }

    // Per-day pct
    const perDayOut = {};
    for (const [day, v] of Object.entries(perDay)) {
      const earned = Math.round((v.earned || 0) * 100) / 100;
      const possible = Math.round((v.possible || 0) * 100) / 100;
      const pct = possible > 0 ? Math.round((earned / possible) * 100) : 0;
      perDayOut[day] = { earned, possible, pct };
    }

    const topConstellations = topN(totals.const, 10);

    // Derive luminaries / shadows based on per-constellation tone
    const constToneScores = totals.constTone || {};
    const lumByConst = Object.entries(constToneScores)
      .map(([id, t]) => ({ id, lum: Number(t?.lum || 0), mix: Number(t?.mix || 0), shd: Number(t?.shd || 0) }))
      .sort((a, b) => b.lum - a.lum);

    const shdByConst = Object.entries(constToneScores)
      .map(([id, t]) => ({ id, lum: Number(t?.lum || 0), mix: Number(t?.mix || 0), shd: Number(t?.shd || 0) }))
      .sort((a, b) => b.shd - a.shd);

    const luminaries = lumByConst.slice(0, 5).map((row) => {
      const entry = getConstellationEntry(row.id);
      return {
        constellation: row.id,
        constellationName: entry?.name || row.id,
        name: entry?.luminary?.name || `Luminary ${row.id}`,
        gift: entry?.luminary?.gift || "—",
        score: row.lum,
      };
    });

    const shadows = shdByConst.slice(0, 5).map((row) => {
      const entry = getConstellationEntry(row.id);
      return {
        constellation: row.id,
        constellationName: entry?.name || row.id,
        name: entry?.shadow?.name || `Shadow ${row.id}`,
        snag: entry?.shadow?.snag || "—",
        score: row.shd,
      };
    });

    const narrativeAxes = buildAxes(luminaries, shadows);

    const legendSeed = `${profileKey}|${topConstellations.map((x) => x.id).join(",")}`;
    const raveliquar = {
      name: deterministicName(legendSeed),
      seed: legendSeed,
    };

    const legend = buildLegend({
      profileKey,
      topLum: luminaries,
      topShd: shadows,
      topConst: topConstellations,
    });

    const bestOfFileKey = typeof meta?.bestOfFileKey === "string" ? meta.bestOfFileKey : "";

    return res.json({
      ok: true,
      result: {
        profileKey,
        submittedAt: new Date().toISOString(),
        totals,
        perDay: perDayOut,
        topConstellations,
        topTones: topN(totals.tone, 3),

        // B) Assembled identity outputs
        luminaries,
        shadows,
        narrativeAxes,
        raveliquar,
        legend,

        // D) Gallery
        gallery: {
          items: gallery,
          bestOfFileKey,
          bestOfUrl: bestOfFileKey ? `/uploads/${encodeURIComponent(bestOfFileKey)}` : "",
        },
      },
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Failed to submit major test",
      error: err?.message || String(err),
    });
  }
}
