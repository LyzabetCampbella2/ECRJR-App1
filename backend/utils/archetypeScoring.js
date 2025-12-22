// backend/utils/archetypeScoring.js

export function addInto(target, delta) {
  if (!delta) return target;
  for (const [k, v] of Object.entries(delta)) {
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    target[k] = (target[k] || 0) + n;
  }
  return target;
}

export function normalizeMap(m) {
  const entries = Object.entries(m);
  const total = entries.reduce((s, [, v]) => s + Math.abs(v || 0), 0);
  if (total === 0) return m;
  const out = {};
  for (const [k, v] of entries) out[k] = (v || 0) / total;
  return out;
}

export function argmax(m) {
  let bestK = null;
  let bestV = -Infinity;
  for (const [k, v] of Object.entries(m)) {
    const n = Number(v);
    if (n > bestV) { bestV = n; bestK = k; }
  }
  return bestK;
}

// cosine similarity for numeric vectors stored as object maps
export function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (const k of Object.keys(a)) {
    const av = Number(a[k] || 0);
    const bv = Number(b[k] || 0);
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * scoreSubmission:
 * - questions: array of question objects (each includes scoring maps)
 * - answers: array of selected option index per question
 */
export function scoreSubmission(questions, answers) {
  const gate1 = {};
  const gate2 = {};
  const gate3 = {};

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const choice = answers[i];
    if (choice == null) continue;

    const s = q?.scoring;
    if (!s) continue;

    addInto(gate1, s.gate1SphereByOption?.[choice]);
    addInto(gate2, s.gate2FamilyByOption?.[choice]);
    addInto(gate3, s.gate3DimsByOption?.[choice]);
  }

  const gate1N = normalizeMap(gate1);
  const gate2N = normalizeMap(gate2);
  const gate3N = normalizeMap(gate3);

  return { gate1: gate1N, gate2: gate2N, gate3: gate3N };
}

/**
 * pickArchetype:
 * - archetypes: array of archetype docs (from Mongo) with vector.gate3Signature numeric dims
 * - familyId: chosen family id like "family_translators"
 * - gate3: normalized gate3 score map
 */
export function pickArchetype(archetypes, familyId, gate3) {
  const candidates = archetypes.filter(a => a?.family?.id === familyId);

  let best = null;
  let bestScore = -Infinity;

  for (const a of candidates) {
    const sig = a?.vector?.gate3Signature || {};
    // compare over keys present in gate3 (keeps it robust while you expand dims)
    const aNum = {};
    for (const k of Object.keys(gate3)) {
      const v = sig[k];
      aNum[k] = Number.isFinite(Number(v)) ? Number(v) : 0;
    }

    const sim = cosineSim(gate3, aNum);
    if (sim > bestScore) {
      bestScore = sim;
      best = a;
    }
  }

  return { best, match: bestScore };
}
