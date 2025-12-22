// backend/scripts/generateArchetypes900.mjs
import fs from "fs";
import path from "path";

function pad3(n) {
  return String(n).padStart(3, "0");
}
function pad2(n) {
  return String(n).padStart(2, "0");
}

// deterministic pseudo-random (stable across runs with same seed)
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function jitter(rng, base, amount = 0.18) {
  // clamp to [-1, 1]
  const v = base + (rng() * 2 - 1) * amount;
  return Math.max(-1, Math.min(1, Number(v.toFixed(3))));
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

const ROOT = process.cwd(); // run from backend folder
const dataDir = path.resolve(ROOT, "data");
const dimDir = path.resolve(dataDir, "dimensions");

ensureDir(dataDir);
ensureDir(dimDir);

// --- 5 spheres (placeholder IDs + names you can rename later without breaking archetype IDs)
const spheres = [
  { id: "cognitive", name: "Cognitive", motif: "clarity, models, meaning" },
  { id: "relational", name: "Relational", motif: "bonding, care, trust" },
  { id: "agentic", name: "Agentic", motif: "action, will, execution" },
  { id: "creative", name: "Creative", motif: "novelty, art, reframe" },
  { id: "integrative", name: "Integrative", motif: "synthesis, stewardship, systems" }
];

// --- 25 families: 5 per sphere (IDs are stable; names can be refined later)
const families = [
  // Cognitive (5)
  { id: "family_translators", sphereId: "cognitive", name: "The Translators", theme: "turn complexity into shared meaning" },
  { id: "family_analysts", sphereId: "cognitive", name: "The Analysts", theme: "measure, compare, verify, refine" },
  { id: "family_architects", sphereId: "cognitive", name: "The Architects", theme: "structure knowledge into frameworks" },
  { id: "family_archivists", sphereId: "cognitive", name: "The Archivists", theme: "preserve truth, record, recall" },
  { id: "family_cartographers", sphereId: "cognitive", name: "The Cartographers", theme: "map patterns across time and context" },

  // Relational (5)
  { id: "family_harmonizers", sphereId: "relational", name: "The Harmonizers", theme: "restore social equilibrium" },
  { id: "family_caretakers", sphereId: "relational", name: "The Caretakers", theme: "protect, nurture, stabilize" },
  { id: "family_diplomats", sphereId: "relational", name: "The Diplomats", theme: "bridge differences with tact" },
  { id: "family_binders", sphereId: "relational", name: "The Binders", theme: "create belonging and loyalty" },
  { id: "family_mirrors", sphereId: "relational", name: "The Mirrors", theme: "reflect emotion and truth back gently" },

  // Agentic (5)
  { id: "family_commanders", sphereId: "agentic", name: "The Commanders", theme: "decide under pressure" },
  { id: "family_executors", sphereId: "agentic", name: "The Executors", theme: "turn plans into outcomes" },
  { id: "family_pathfinders", sphereId: "agentic", name: "The Pathfinders", theme: "advance into unknown terrain" },
  { id: "family_guardians", sphereId: "agentic", name: "The Guardians", theme: "defend boundaries and standards" },
  { id: "family_challengers", sphereId: "agentic", name: "The Challengers", theme: "test strength, provoke growth" },

  // Creative (5)
  { id: "family_storyweavers", sphereId: "creative", name: "The Storyweavers", theme: "shape meaning through narrative" },
  { id: "family_originators", sphereId: "creative", name: "The Originators", theme: "start movements, spark ideas" },
  { id: "family_alchemists", sphereId: "creative", name: "The Alchemists", theme: "transform constraints into style" },
  { id: "family_oracles", sphereId: "creative", name: "The Oracles", theme: "sense emergent futures and symbols" },
  { id: "family_curators", sphereId: "creative", name: "The Curators", theme: "select, refine, and present beauty" },

  // Integrative (5)
  { id: "family_synthesists", sphereId: "integrative", name: "The Synthesists", theme: "combine parts into coherent whole" },
  { id: "family_stewards", sphereId: "integrative", name: "The Stewards", theme: "maintain health of systems over time" },
  { id: "family_mediators", sphereId: "integrative", name: "The Mediators", theme: "balance competing truths fairly" },
  { id: "family_signalers", sphereId: "integrative", name: "The Signalers", theme: "detect weak signals, warn early" },
  { id: "family_weavers", sphereId: "integrative", name: "The Weavers", theme: "connect networks, people, and meaning" }
];

// --- family baseline vectors (Gate 3 signature “shape”)
// Values in [-1,1]. Archetypes in family will jitter around these.
const familyBaseVector = {
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

// --- content generators
function makeSciencePage({ sphere, family, idxInFamily, globalIndex }) {
  const memberNo = idxInFamily + 1;

  const psychological = {
    cognitiveOrientation: [
      `Default orientation: ${sphere.motif}.`,
      `Family pattern: ${family.theme}.`,
      `Individual emphasis: variant ${memberNo} of this family.`
    ],
    motivationalDrivers: [
      "Coherence",
      "Competence",
      "Impact",
      "Belonging"
    ],
    emotionalRegulation: [
      "Baseline regulation: stable until meaning or values are violated.",
      "Stress response: narrows focus; can become rigid or over-responsive depending on context."
    ],
    shadowExpression: [
      "Over-applies the family strength in the wrong environment.",
      "Confuses certainty with correctness."
    ],
    growthEdges: [
      "Practice flexible interpretation under uncertainty.",
      "Maintain recovery habits that protect cognition and empathy."
    ]
  };

  const sociology = {
    groupRole: [
      `Typical group role: ${family.name} (variant ${memberNo}).`,
      "Often becomes a reference point for others during ambiguity."
    ],
    authorityRelationship: [
      "Prefers legitimacy by competence rather than status alone.",
      "Will resist unclear or inconsistent standards."
    ],
    conflictStyle: [
      "Tends toward problem-solving first; may withdraw if discussion becomes performative."
    ],
    failureMode: [
      "Burnout from carrying meaning-making or responsibility alone.",
      "Overcorrects the group instead of pacing change."
    ]
  };

  const anthropology = {
    historicalAnalogues: [
      "Interpreter / envoy",
      "Steward / record-keeper",
      "Navigator / ritual specialist"
    ],
    recurrencePattern: [
      `Emerges in cultures where ${sphere.name.toLowerCase()} competence grants social trust.`,
      "Often appears at boundaries: between groups, between eras, or between systems."
    ],
    socialNiche: [
      "Boundary-crossing roles that require translation of norms and meanings."
    ]
  };

  const pedagogy = {
    learningStyle: [
      "Learns by pattern extraction and teaching-back.",
      "Improves through iterative feedback loops."
    ],
    teachingBias: [
      "Clarity-first sequencing: definitions → examples → nuance.",
      "Builds scaffolds before demanding performance."
    ],
    whatBreaksLearning: [
      "Unclear rubrics, shifting expectations, or status games."
    ]
  };

  const biology = {
    nervousSystem: [
      "Context-sensitive arousal: increases alertness when uncertainty rises.",
      "Recovery improves when environments are predictable and values-aligned."
    ],
    stressPhysiology: [
      "Stress signature varies by individual: fight/flight/freeze blends.",
      "Under chronic stress: reduced tolerance for ambiguity."
    ],
    energyPattern: [
      "Focused bursts + consolidation phase.",
      "Needs deliberate recovery to prevent cognitive fatigue."
    ]
  };

  const adjacentSciences = {
    systemsTheory: [
      "Reduces noise and strengthens feedback loops by improving signal clarity.",
      "Identifies bottlenecks in communication and coordination."
    ],
    decisionScience: [
      "Bias risk: analysis paralysis under high stakes.",
      "Strength: reframing options improves choice quality."
    ],
    communicationPattern: [
      "Meta-language: defines terms, boundaries, and meanings.",
      "Uses examples to anchor abstract concepts."
    ]
  };

  const lore = {
    paragraph:
      `In the archives of the ${sphere.name} Sphere, the ${family.name} are remembered for one duty: ` +
      `to ${family.theme}. This one—marked as the ${memberNo}th of their line—walks with quiet ` +
      `precision, carrying a private vow: restore signal, protect meaning, and leave the system cleaner than they found it.`
  };

  const integration = {
    growthConditions: [
      "Clear scope and boundaries.",
      "Time to refine without shame or urgency theater."
    ],
    healthySignals: [
      "Others repeat the framing accurately.",
      "Decisions improve without needing constant correction."
    ],
    practices: [
      "Deliberate recovery (sleep, movement, quiet).",
      "Periodic recalibration: what matters, what changes, what stays."
    ]
  };

  const relations = {
    adjacent: [],
    misidentifications: [],
    shadowAdjacent: []
  };

  return {
    psychology: psychological,
    sociology,
    anthropology,
    pedagogy,
    biology,
    adjacentSciences,
    lore,
    integration,
    relations
  };
}

function build900() {
  const out = [];
  let globalIndex = 0;

  // Group families by sphere to enforce 5x5 structure
  const famBySphere = spheres.map((s) => ({
    sphere: s,
    families: families.filter((f) => f.sphereId === s.id)
  }));

  // Sanity: 25 families total, 5 per sphere
  for (const group of famBySphere) {
    if (group.families.length !== 5) {
      throw new Error(`Sphere ${group.sphere.id} does not have 5 families (found ${group.families.length}).`);
    }
  }

  // 36 archetypes per family
  for (const group of famBySphere) {
    const sphere = group.sphere;

    for (const family of group.families) {
      const base = familyBaseVector[family.id];
      if (!base) throw new Error(`Missing base vector for family: ${family.id}`);

      for (let i = 0; i < 36; i++) {
        globalIndex += 1;

        const archId = `arch_${pad3(globalIndex)}`;
        const code = `${sphere.id.toUpperCase().slice(0, 3)}-${family.id.split("_")[1].toUpperCase().slice(0, 4)}-${pad2(i + 1)}`;

        const rng = mulberry32(globalIndex * 1337);

        // Create individual vector by jittering family baseline
        const gate3Signature = {};
        for (const [k, v] of Object.entries(base)) {
          gate3Signature[k] = jitter(rng, v, 0.22);
        }

        // A few derived tags for searchability
        const tags = [
          sphere.id,
          family.id,
          sphere.name.toLowerCase(),
          family.name.toLowerCase().replace(/\s+/g, "_"),
          "archetype"
        ];

        const memberNo = i + 1;

        const name = `${family.name.slice(0, -1)} ${memberNo}`; // e.g., "The Translator 1" style
        const oneLine = `A ${sphere.name.toLowerCase()} archetype of ${family.name.toLowerCase()} — variant ${memberNo}.`;
        const primaryFunction = family.theme;
        const adaptiveRoleSummary = `Operates within the ${sphere.name} Sphere as a member of ${family.name}, specializing in: ${family.theme}.`;

        out.push({
          id: archId,
          code,
          name,

          sphere: { id: sphere.id, name: sphere.name },
          family: { id: family.id, name: family.name },

          oneLine,
          primaryFunction,
          adaptiveRoleSummary,

          page: makeSciencePage({ sphere, family, idxInFamily: i, globalIndex }),

          vector: { gate3Signature },
          tags
        });
      }
    }
  }

  if (out.length !== 900) throw new Error(`Expected 900 archetypes, got ${out.length}`);
  return out;
}

function writeJSON(filePath, obj) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), "utf8");
  console.log("✅ Wrote:", filePath);
}

function main() {
  // Write spheres/families truth files
  writeJSON(path.resolve(dimDir, "gate1.spheres.json"), spheres.map(({ id, name }) => ({ id, name })));
  writeJSON(path.resolve(dimDir, "gate2.families.json"), families.map(({ id, name, sphereId }) => ({ id, name, sphereId })));

  // Write archetypes library
  const archetypes = build900();
  writeJSON(path.resolve(dataDir, "lore.archetypes.json"), archetypes);

  console.log("✅ Generated archetypes:", archetypes.length);
  console.log("ℹ️ Next: seed into Mongo with your seed script.");
}

main();
