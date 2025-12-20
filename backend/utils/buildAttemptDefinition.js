// backend/utils/buildAttemptDefinition.js
import crypto from "crypto";

function makeSeedInt(seedStr) {
  const hex = crypto.createHash("sha256").update(seedStr).digest("hex").slice(0, 8);
  return parseInt(hex, 16);
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickSeeded(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffleSeeded(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildAttemptDefinition({ blueprint, bank, userId, attemptId }) {
  const seedStr = `${userId}:${blueprint.testId || blueprint.id || "test"}:${attemptId}`;
  const rng = mulberry32(makeSeedInt(seedStr));

  const bankBySlot = new Map(bank.map((b) => [b.slotId, b]));

  // 1) Inject generated prompt for each likert question (locked snapshot)
  const categories = (blueprint.categories || []).map((cat) => {
    const questions = (cat.questions || []).map((q) => {
      if (q.type !== "likert") return q;

      const entry = bankBySlot.get(q.questionId);
      if (!entry?.variants?.length) return q;

      return {
        ...q,
        prompt: pickSeeded(entry.variants, rng)
      };
    });

    return { ...cat, questions };
  });

  const definition = {
    ...blueprint,
    categories,
    generated: { attemptId, seed: seedStr }
  };

  // 2) Build daily batches: 15 likert per category per day (7 days)
  const DAYS = Number(definition?.schedule?.days || definition?.days || 7);
  const PER_CAT_PER_DAY = Number(definition?.schedule?.perCategoryLikertPerDay || 15);

  const dayMap = {};
  for (let d = 1; d <= DAYS; d++) dayMap[String(d)] = { likertIds: [] };

  for (const cat of definition.categories || []) {
    const likertIds = (cat.questions || [])
      .filter((q) => q.type === "likert" && q.questionId)
      .map((q) => q.questionId);

    if (!likertIds.length) continue;

    // seeded shuffle so daily batches are stable for this attempt
    const shuffled = shuffleSeeded(likertIds, rng);

    // We want 15 per day per category; if not enough questions, we cycle.
    let idx = 0;
    for (let day = 1; day <= DAYS; day++) {
      const picks = [];
      for (let k = 0; k < PER_CAT_PER_DAY; k++) {
        picks.push(shuffled[idx % shuffled.length]);
        idx++;
      }
      dayMap[String(day)].likertIds.push(...picks);
    }
  }

  definition.schedule = {
    ...(definition.schedule || {}),
    days: DAYS,
    perCategoryLikertPerDay: PER_CAT_PER_DAY,
    assignmentsPerDay: Number(definition?.schedule?.assignmentsPerDay || 3),
    dayMap
  };

  return definition;
}
