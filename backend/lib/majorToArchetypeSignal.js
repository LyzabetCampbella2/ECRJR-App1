// backend/lib/majorToArchetypeSignal.js
// Converts Major Test totals into an archetype-selection signal.
// v1: deterministic, linear, safe defaults.

export function normalizeTotals(totals = {}, targetMax = 100) {
  const entries = Object.entries(totals || {}).map(([k, v]) => [k, Number(v || 0)]);
  if (!entries.length) return {};

  const maxVal = Math.max(...entries.map(([, v]) => v), 1);
  const out = {};
  for (const [k, v] of entries) {
    out[k] = Math.round((v / maxVal) * targetMax);
  }
  return out;
}

/**
 * Map Major dimensions -> Archetype tags
 * You can tune these mappings later without breaking data.
 */
const MAJOR_TO_ARCH_TAG_WEIGHTS = {
  discipline: { "arch_mastery": 0.9, "arch_scholar": 0.6, "arch_builder": 0.5 },
  experimentation: { "arch_alchemist": 0.9, "arch_trickster": 0.5, "arch_explorer": 0.6 },
  symbolism: { "arch_mystic": 0.9, "arch_oracle": 0.7, "arch_poet": 0.6 },
  mastery: { "arch_craftsman": 0.9, "arch_strategist": 0.6, "arch_architect": 0.6 },
  intuition: { "arch_seer": 0.9, "arch_empath": 0.7, "arch_dreamer": 0.6 },
};

/**
 * Returns: archetypeSignal { tag -> points }
 * Example: { arch_mystic: 54, arch_seer: 38, ... }
 */
export function majorToArchetypeSignal(majorTotalsRaw = {}) {
  const major = normalizeTotals(majorTotalsRaw, 100);
  const signal = {};

  for (const [majorKey, score] of Object.entries(major)) {
    const map = MAJOR_TO_ARCH_TAG_WEIGHTS[majorKey];
    if (!map) continue;

    for (const [archTag, w] of Object.entries(map)) {
      const add = score * w;
      signal[archTag] = (signal[archTag] || 0) + add;
    }
  }

  // round + clamp
  for (const k of Object.keys(signal)) {
    signal[k] = Math.round(Math.max(0, Math.min(100, signal[k])));
  }

  return signal;
}
