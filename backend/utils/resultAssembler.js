/**
 * ECRJR — Result Assembler (Day 12)
 * --------------------------------
 * Single assembly point for the final Result object.
 *
 * Responsibilities:
 * - Build Shadow Aspects (5) and Luminary Aspects (5)
 * - Build Artist Archetype (form)
 * - Pair into Narrative Axes (5)
 * - Generate Legendary Raveliquar Name
 * - Generate 3-paragraph Legend Narrative
 * - Generate Raveliquarith Summary
 *
 * Notes:
 * - Deterministic v1: no randomness; relies on stable ordering + seed
 * - Replace the "library" sections later with your real 800/900 content sources
 */

function stableHashToInt(input) {
  // Very small deterministic hash for v1 selection (not crypto)
  const str = String(input ?? "");
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// ------------------------------
// Canonical category maps (locked)
// ------------------------------
const SHADOW_CATEGORY_ORDER = [
  "Containment",
  "Fragmentation",
  "Overextension",
  "Fixation",
  "Obfuscation"
];

const LUMINARY_CATEGORY_ORDER = [
  "Clarity",
  "Continuity",
  "Expansion",
  "Refinement",
  "Illumination"
];

// Fixed pairing map by category (Day 6 lock)
const PAIRING_MAP = {
  Containment: "Expansion",
  Fragmentation: "Clarity",
  Overextension: "Continuity",
  Fixation: "Refinement",
  Obfuscation: "Illumination"
};

// ------------------------------
// v1 content libraries (anchors)
// Replace later with your 800/900 catalogs.
// ------------------------------
const SHADOW_ASPECT_LIBRARY_V1 = [
  {
    aspectId: "SH_SEALED_CURRENT",
    name: "The Sealed Current",
    category: "Containment",
    pressureCondition: "Expression is deemed unsafe or premature",
    distortionEffect: "Creativity is withheld beyond necessity",
    protectiveFunction: "Prevents exposure before stability",
    releaseCondition: "Trusted structure or sanctuary appears"
  },
  {
    aspectId: "SH_FRACTURED_SIGNAL",
    name: "Fractured Signal",
    category: "Fragmentation",
    pressureCondition: "Competing demands exceed integration capacity",
    distortionEffect: "Ideas scatter without resolution",
    protectiveFunction: "Avoids collapse by diffusion",
    releaseCondition: "Singular focus is restored"
  },
  {
    aspectId: "SH_EXHAUSTED_REACH",
    name: "The Exhausted Reach",
    category: "Overextension",
    pressureCondition: "Output demanded faster than recovery",
    distortionEffect: "Quality decays under urgency",
    protectiveFunction: "Attempts to meet external pressure",
    releaseCondition: "Rhythm and limits are re-established"
  },
  {
    aspectId: "SH_LOCKED_PATTERN",
    name: "The Locked Pattern",
    category: "Fixation",
    pressureCondition: "Change threatens existing coherence",
    distortionEffect: "Repetition replaces adaptation",
    protectiveFunction: "Preserves known stability",
    releaseCondition: "Safe experimentation is permitted"
  },
  {
    aspectId: "SH_VEILED_EXPRESSION",
    name: "Veiled Expression",
    category: "Obfuscation",
    pressureCondition: "Visibility introduces risk",
    distortionEffect: "Meaning is disguised or indirect",
    protectiveFunction: "Shields essence from misuse",
    releaseCondition: "Context becomes trustworthy"
  }
];

const LUMINARY_ASPECT_LIBRARY_V1 = [
  {
    aspectId: "LU_CLEAR_AXIS",
    name: "Clear Axis",
    category: "Clarity",
    activationCondition: "Purpose and method align",
    expressionEffect: "Decisions become precise and unambiguous",
    sustainingFactor: "Honest feedback loops",
    integrationNote: "Requires periodic reassessment"
  },
  {
    aspectId: "LU_ENDURING_THREAD",
    name: "Enduring Thread",
    category: "Continuity",
    activationCondition: "Rhythm is respected over urgency",
    expressionEffect: "Creation sustains without depletion",
    sustainingFactor: "Rest and repetition",
    integrationNote: "Breaks under forced acceleration"
  },
  {
    aspectId: "LU_OPEN_HORIZON",
    name: "Open Horizon",
    category: "Expansion",
    activationCondition: "Stability precedes outreach",
    expressionEffect: "Influence extends without dilution",
    sustainingFactor: "Anchored values",
    integrationNote: "Requires boundaries to remain coherent"
  },
  {
    aspectId: "LU_REFINED_HAND",
    name: "Refined Hand",
    category: "Refinement",
    activationCondition: "Time and attention are available",
    expressionEffect: "Work gains elegance and restraint",
    sustainingFactor: "Iteration over novelty",
    integrationNote: "Collapses under constant comparison"
  },
  {
    aspectId: "LU_REVEALED_RESONANCE",
    name: "Revealed Resonance",
    category: "Illumination",
    activationCondition: "Truth is permitted visibility",
    expressionEffect: "Meaning is felt and understood simultaneously",
    sustainingFactor: "Integrity of intent",
    integrationNote: "Cannot be forced or performed"
  }
];

// v1 Artist Archetype anchors (replace later with your catalog)
const ARTIST_ARCHETYPE_LIBRARY_V1 = [
  {
    name: "The Silent Architect",
    sphere: "Convergence",
    family: "Architect",
    coreFunction: "To construct coherent systems from fragmented elements, prioritizing structure before expression.",
    worldInteraction: "Stabilizes environments by imposing order where meaning has scattered.",
    magicExpression: "Power manifests through design, planning, and invisible architecture.",
    shadowDistortion: "Structure becomes rigidity; containment replaces safety.",
    luminaryExpression: "Creates structures that breathe—flexible enough to evolve without collapse.",
    narrativeRole: "Builder of worlds, laws, institutions, and hidden frameworks that outlast individuals."
  },
  {
    name: "The Resonant Weaver",
    sphere: "Convergence",
    family: "Weaver",
    coreFunction: "To bind disparate elements into living networks of meaning.",
    worldInteraction: "Connects people, ideas, and forces that would otherwise remain isolated.",
    magicExpression: "Magic appears as threads, echoes, and harmonics—often invisible until tension reveals the weave.",
    shadowDistortion: "Connection becomes entanglement; boundaries dissolve.",
    luminaryExpression: "Creates bonds that strengthen autonomy rather than diminish it.",
    narrativeRole: "Bridge-maker, lore-binder, and quiet orchestrator of alliance."
  },
  {
    name: "The Bound Witness",
    sphere: "Convergence",
    family: "Witness",
    coreFunction: "To observe, record, and preserve truth without altering its nature.",
    worldInteraction: "Anchors reality by remembering it accurately when memory would otherwise fracture.",
    magicExpression: "Magic manifests through inscription, record, and stabilization of narrative truth.",
    shadowDistortion: "Observation becomes paralysis; preservation becomes avoidance.",
    luminaryExpression: "Preserves truth while enabling transformation to proceed safely.",
    narrativeRole: "Archivist, chronicler, and keeper of forbidden or fragile knowledge."
  }
];

// Core Titles pool (Day 7)
const CORE_TITLES_V1 = [
  "Architect",
  "Weaver",
  "Witness",
  "Bearer",
  "Chronicler",
  "Warden",
  "Cartographer",
  "Custodian",
  "Forger",
  "Arbiter"
];

// Domain pools (Day 7) — used to synthesize “of [Domain]”
const DOMAIN_FORCES = ["Echo", "Silence", "Threshold", "Continuity", "Fracture", "Concord", "Memory", "Veil", "Axis", "Horizon"];
const DOMAIN_TRANSFORMS = ["Shattered", "Veiled", "Unwritten", "Bound", "Fractured", "Enduring", "Hollow", "Liminal", "Sealed", "Revealed"];
const DOMAIN_OBJECTS = ["Thread", "Record", "Gate", "Flame", "Signal", "Order", "Current", "Measure", "Passage", "Concord"];

// ------------------------------
// Selection helpers (deterministic)
// ------------------------------
function pickOneDeterministic(list, seedStr) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const idx = stableHashToInt(seedStr) % list.length;
  return list[idx];
}

function selectOnePerCategory(library, categoryOrder, seedBase) {
  // In v1, we assume the library already contains at least 1 per category.
  // If later you have many per category, this picks deterministically within each category.
  const results = [];

  for (const category of categoryOrder) {
    const options = library.filter((a) => a.category === category);
    const chosen = pickOneDeterministic(options, `${seedBase}:${category}`);
    if (!chosen) {
      throw new Error(`Missing aspect for category: ${category}`);
    }
    results.push(chosen);
  }

  return results; // exactly 5
}

function pairNarrativeAxes(shadowAspects, luminaryAspects) {
  // Build lookup by luminary category for quick pairing.
  const lumByCat = new Map();
  for (const l of luminaryAspects) lumByCat.set(l.category, l);

  const axes = [];
  for (const sh of shadowAspects) {
    const targetLumCat = PAIRING_MAP[sh.category];
    const lu = lumByCat.get(targetLumCat);
    if (!lu) {
      throw new Error(`Cannot pair shadow category '${sh.category}' to luminary category '${targetLumCat}' (missing luminary)`);
    }

    const axisName = `${targetLumCat} vs ${sh.category}`; // stable v1 naming

    axes.push({
      axisId: `AX_${sh.aspectId}__${lu.aspectId}`,
      axisName,

      shadowAspect: { aspectId: sh.aspectId, name: sh.name, category: sh.category },
      luminaryAspect: { aspectId: lu.aspectId, name: lu.name, category: lu.category },

      // v1 axis text can be improved later; it is consistent and doctrine-safe now.
      tensionPattern: `Tension between ${sh.name} and ${lu.name}.`,
      storyPressure: `Situations emerge where ${sh.category.toLowerCase()} pressures collide with ${lu.category.toLowerCase()} coherence.`,
      magicBehavior: `Magic manifests contextually as the system attempts to maintain balance along this axis.`,
      resolutionPath: `Balance is restored through measured alignment rather than cancellation of either force.`
    });
  }

  // Must be exactly 5
  if (axes.length !== 5) throw new Error("Narrative axes must be exactly 5.");
  return axes;
}

// ------------------------------
// Name + legend generation
// ------------------------------
function synthesizeDomain({ dominantAxis, stabilizingAxis, seedBase }) {
  // Deterministic domain synthesis using axis categories + seed
  // Domain format: "[Transform] [Force]" OR "[Transform] [Object]" OR "[Force] [Object]"
  const t = pickOneDeterministic(DOMAIN_TRANSFORMS, `${seedBase}:T:${dominantAxis.axisId}`);
  const f = pickOneDeterministic(DOMAIN_FORCES, `${seedBase}:F:${stabilizingAxis.axisId}`);
  const o = pickOneDeterministic(DOMAIN_OBJECTS, `${seedBase}:O:${dominantAxis.axisId}:${stabilizingAxis.axisId}`);

  // Choose one of three patterns deterministically
  const patternPick = stableHashToInt(`${seedBase}:P:${dominantAxis.axisId}`) % 3;
  if (patternPick === 0) return `${t} ${f}`;
  if (patternPick === 1) return `${t} ${o}`;
  return `${f} ${o}`;
}

function selectCoreTitle({ artistArchetype, seedBase }) {
  // Prefer a title that matches the family if possible; otherwise deterministic from pool.
  const family = (artistArchetype?.family || "").toLowerCase();
  const familyMap = {
    architect: "Architect",
    weaver: "Weaver",
    witness: "Witness"
  };
  const mapped = familyMap[family];
  if (mapped) return mapped;
  return pickOneDeterministic(CORE_TITLES_V1, `${seedBase}:coreTitle`) || "Witness";
}

function generateLegendaryRaveliquarName({ coreTitle, domain }) {
  return `The ${coreTitle} of ${domain}`;
}

function generateLegendNarrative({ name, artistArchetype, dominantAxis, stabilizingAxis }) {
  // Exactly 3 paragraphs (Day 8 lock). Present tense, observational tone.
  const p1 = `${name} exists as ${artistArchetype.name} within the sphere of ${artistArchetype.sphere}. Their presence shapes how creation moves through the world.`;
  const p2 = `They are shaped by the tension between ${dominantAxis.shadowAspect.name} and ${dominantAxis.luminaryAspect.name}. This axis governs the pressure that defines their story and the manner in which their magic behaves.`;
  const p3 = `Through Raveliquarith judgment, balance is maintained by ${stabilizingAxis.luminaryAspect.name.toLowerCase()} against ${stabilizingAxis.shadowAspect.name.toLowerCase()}. In this way, the Raveliquar endures in measured coherence.`;

  return [p1, p2, p3];
}

function generateRaveliquarithSummary({ name, dominantAxis, stabilizingAxis, artistArchetype }) {
  // Calm, declarative, non-gamified
  const interpretiveFocus = `Coherence through ${artistArchetype.family.toLowerCase()} form under sustained tension.`;
  const keyPattern = `Dominant axis: ${dominantAxis.axisName}. Stabilizing axis: ${stabilizingAxis.axisName}.`;
  const judgmentStatement = `${name} persists where pressure and clarity coexist, shaping outcomes through disciplined alignment rather than force.`;

  return {
    interpretiveFocus,
    keyPattern,
    judgmentStatement,
    dominantAxisId: dominantAxis.axisId,
    stabilizingAxisId: stabilizingAxis.axisId
  };
}

function selectDominantAndStabilizingAxes(axes, seedBase) {
  // v1: deterministic “dominant” and “stabilizing” selection.
  // Later, replace with scoring weights from your tests.
  const domIdx = stableHashToInt(`${seedBase}:dominant`) % axes.length;

  let stabIdx = stableHashToInt(`${seedBase}:stabilizing`) % axes.length;
  if (stabIdx === domIdx) stabIdx = (stabIdx + 1) % axes.length;

  return { dominantAxis: axes[domIdx], stabilizingAxis: axes[stabIdx] };
}

// ------------------------------
// Public API: assembleResult
// ------------------------------
/**
 * assembleResult
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.runId   unique per completion cycle
 * @param {Date|string} [params.completedAt]
 * @param {Object} [params.inputs] raw test inputs/signals (optional in v1)
 *
 * @returns {Object} full Result object ready to save in Mongo via Result model
 */
function assembleResult({ userId, runId, completedAt, inputs = {} }) {
  if (!userId) throw new Error("assembleResult requires userId");
  if (!runId) throw new Error("assembleResult requires runId");

  const doneAt = completedAt ? new Date(completedAt) : new Date();
  const seedBase = `${userId}:${runId}:${doneAt.toISOString()}`;

  // 1) Aspects (exactly 5 each)
  const shadowAspects = selectOnePerCategory(SHADOW_ASPECT_LIBRARY_V1, SHADOW_CATEGORY_ORDER, `${seedBase}:shadow`);
  const luminaryAspects = selectOnePerCategory(LUMINARY_ASPECT_LIBRARY_V1, LUMINARY_CATEGORY_ORDER, `${seedBase}:luminary`);

  // 2) Artist Archetype (v1 deterministic)
  // Later: derive from test signals; for now pick from anchor set.
  const artistArchetype = pickOneDeterministic(ARTIST_ARCHETYPE_LIBRARY_V1, `${seedBase}:artistArchetype`);
  if (!artistArchetype) throw new Error("Missing artist archetype (v1 library empty).");

  // 3) Narrative Axes (exactly 5)
  const narrativeAxes = pairNarrativeAxes(shadowAspects, luminaryAspects);

  // 4) Dominant + Stabilizing Axis selection
  const { dominantAxis, stabilizingAxis } = selectDominantAndStabilizingAxes(narrativeAxes, seedBase);

  // 5) Legendary Raveliquar Name
  const coreTitle = selectCoreTitle({ artistArchetype, seedBase });
  const domain = synthesizeDomain({ dominantAxis, stabilizingAxis, seedBase });
  const legendaryRaveliquarName = generateLegendaryRaveliquarName({ coreTitle, domain });

  // 6) Legend Narrative (3 paragraphs exactly)
  const paragraphs = generateLegendNarrative({
    name: legendaryRaveliquarName,
    artistArchetype,
    dominantAxis,
    stabilizingAxis
  });

  // 7) Integration Axis (v1; replace later with richer synthesis)
  const integrationAxis = {
    tension: `Sustaining ${artistArchetype.family.toLowerCase()} form while navigating dominant narrative pressure.`,
    growthVector: "Coherence stabilizes when expression is structured before expansion.",
    stabilizingPractice: "Return to rhythm, boundaries, and deliberate refinement."
  };

  // 8) Raveliquarith Summary
  const raveliquarithSummary = generateRaveliquarithSummary({
    name: legendaryRaveliquarName,
    dominantAxis,
    stabilizingAxis,
    artistArchetype
  });

  // 9) Assemble final Result object (matches Result.js)
  const resultObject = {
    userId,
    runId,
    completedAt: doneAt,

    legendaryRaveliquarName,
    legendNarrative: { paragraphs },

    artistArchetype,

    // Optional compatibility field if you still use primaryArchetype in places:
    // primaryArchetype: undefined,

    shadowAspects,
    luminaryAspects,
    narrativeAxes,

    integrationAxis,
    raveliquarithSummary,

    provenance: {
      engineVersion: "v1",
      contentVersion: "v1"
    },

    // Keep raw inputs out of Result by default (doctrine: meaning stored, not recomputed).
    // If you want traceability, store inputs elsewhere (e.g., TestProgressLog).
  };

  return resultObject;
}

module.exports = {
  assembleResult,

  // Export helpers for unit tests / debugging
  _internals: {
    stableHashToInt,
    selectOnePerCategory,
    pairNarrativeAxes,
    selectDominantAndStabilizingAxes,
    selectCoreTitle,
    synthesizeDomain,
    generateLegendaryRaveliquarName,
    generateLegendNarrative,
    generateRaveliquarithSummary
  }
};
