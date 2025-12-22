// backend/lib/blendArchetypeScores.js
// Blends base archetype scores with major-signal to influence selection.

export function blendArchetypeScores({
  baseScores = {},       // your existing archetype totals
  majorSignal = {},      // output of majorToArchetypeSignal()
  wBase = 0.75,
  wMajor = 0.25,
} = {}) {
  const out = {};
  const keys = new Set([...Object.keys(baseScores), ...Object.keys(majorSignal)]);

  for (const k of keys) {
    const b = Number(baseScores[k] || 0);
    const m = Number(majorSignal[k] || 0);

    // Weighted blend
    const v = (b * wBase) + (m * wMajor);

    // Keep it stable & bounded
    out[k] = Math.round(Math.max(0, Math.min(100, v)));
  }
  return out;
}
