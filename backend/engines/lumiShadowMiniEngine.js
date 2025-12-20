// backend/engines/lumiShadowMiniEngine.js
const fs = require("fs");
const path = require("path");

function safeReadJSON(relPath) {
  const p = path.join(__dirname, "..", relPath);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function addTagScores(target, delta = {}) {
  for (const [k, v] of Object.entries(delta)) {
    target[k] = (target[k] || 0) + Number(v || 0);
  }
}

function normalizeTags(tags) {
  // light normalization: keep it stable and comparable
  const vals = Object.values(tags);
  const sum = vals.reduce((a, b) => a + b, 0) || 1;
  const out = {};
  for (const [k, v] of Object.entries(tags)) out[k] = v / sum;
  return out;
}

function dot(tags, archetypeTags = {}) {
  let score = 0;
  for (const [k, w] of Object.entries(archetypeTags)) {
    score += (tags[k] || 0) * Number(w || 0);
  }
  return score;
}

function pickTop(archetypes, tags, topN = 5) {
  return [...archetypes]
    .map((a) => ({
      id: a.id,
      name: a.name,
      family: a.family || null,
      score: dot(tags, a.tags || {}),
      tags: a.tags || {}
    }))
    .sort((x, y) => y.score - x.score)
    .slice(0, topN);
}

/**
 * answersByTest example:
 * {
 *   lumishadow_mini_1: [{ questionId:"VA1", choiceKey:"A" }, ...],
 *   lumishadow_mini_2: ...
 * }
 */
function scoreLumiShadowMiniSuite({ miniBank, answersByTest, luminaryCatalog, shadowCatalog }) {
  const lumTags = {};
  const shaTags = {};

  for (const [testId, testDef] of Object.entries(miniBank)) {
    const answers = answersByTest?.[testId] || [];
    const qById = Object.fromEntries((testDef.questions || []).map((q) => [q.id, q]));

    for (const a of answers) {
      const q = qById[a.questionId];
      if (!q) continue;
      const opt = (q.options || []).find((o) => o.key === a.choiceKey);
      if (!opt) continue;

      addTagScores(lumTags, opt.lum);
      addTagScores(shaTags, opt.sha);
    }
  }

  const lumN = normalizeTags(lumTags);
  const shaN = normalizeTags(shaTags);

  const topLuminaries = pickTop(luminaryCatalog, lumN, 5);
  const topShadows = pickTop(shadowCatalog, shaN, 5);

  return {
    luminaryTags: lumN,
    shadowTags: shaN,
    topLuminaries,
    topShadows
  };
}

/**
 * Convenience loader (so you can run immediately with starter catalogs).
 */
function loadMiniSuiteAndCatalogs() {
  const miniBank = safeReadJSON("data/miniTests.lumiShadow.json") || {};

  // If you already have your real catalogs, point these to your real files.
  // For now, ship a small starter catalog so it works today.
  const luminaryCatalog =
    safeReadJSON("data/luminary.catalog.json") ||
    [
      { id: "LUM_BEACON", name: "The Beacon", family: "Luminary", tags: { beacon: 1, legacy: 0.6, clarity: 0.4 } },
      { id: "LUM_GUARDIAN", name: "The Guardian", family: "Luminary", tags: { guardian: 1, mercy: 0.6, oath: 0.4 } },
      { id: "LUM_ARCHITECT", name: "The Architect", family: "Luminary", tags: { architect: 1, discipline: 0.6, strategy: 0.4 } },
      { id: "LUM_SOVEREIGN", name: "The Sovereign", family: "Luminary", tags: { sovereign: 1, resolve: 0.6, temperance: 0.3 } },
      { id: "LUM_MENTOR", name: "The Mentor", family: "Luminary", tags: { mentor: 1, mercy: 0.5, clarity: 0.5 } },
      { id: "LUM_COMMANDER", name: "The Commander", family: "Luminary", tags: { command: 1, strategy: 0.6, oath: 0.3 } },
      { id: "LUM_JUDGE", name: "The Judge", family: "Luminary", tags: { judge: 1, clarity: 0.8, temperance: 0.2 } }
    ];

  const shadowCatalog =
    safeReadJSON("data/shadow.catalog.json") ||
    [
      { id: "SHA_DOMINATOR", name: "The Dominator", family: "Shadow", tags: { domination: 1, control: 0.7, pride: 0.3 } },
      { id: "SHA_MARTYR", name: "The Martyr", family: "Shadow", tags: { martyrdom: 1, resentment: 0.6, appeasement: 0.3 } },
      { id: "SHA_VOID", name: "The Voidwalker", family: "Shadow", tags: { detachment: 1, isolation: 0.7, avoidance: 0.4 } },
      { id: "SHA_PERFECTION", name: "The Perfection Cage", family: "Shadow", tags: { perfectionism: 1, rigidity: 0.6, anxiety: 0.3 } },
      { id: "SHA_MANIPULATOR", name: "The Manipulator", family: "Shadow", tags: { manipulation: 1, vanity: 0.4, control: 0.4 } },
      { id: "SHA_RUMINATOR", name: "The Ruminator", family: "Shadow", tags: { rumination: 1, shame: 0.5, anxiety: 0.4 } }
    ];

  return { miniBank, luminaryCatalog, shadowCatalog };
}

module.exports = {
  scoreLumiShadowMiniSuite,
  loadMiniSuiteAndCatalogs
};
