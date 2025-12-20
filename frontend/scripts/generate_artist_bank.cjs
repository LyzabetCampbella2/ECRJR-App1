/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

// ---------------------------
// Helpers
// ---------------------------
function uniq(arr) {
  return Array.from(new Set(arr));
}

function clampMinVariants(slotId, variants, min = 8) {
  const v = uniq(
    (variants || [])
      .filter(Boolean)
      .map((s) => String(s).trim())
      .filter((s) => s.length > 0)
  );
  if (v.length < min) {
    throw new Error(`Slot ${slotId} has only ${v.length} variants (min=${min}).`);
  }
  return v.slice(0, min);
}

// ---------------------------
// Base phrase packs (keeps meaning stable)
// ---------------------------
const packs = {
  intrinsic: [
    "even if no one ever saw it",
    "without praise or feedback",
    "without external recognition",
    "without sharing it publicly",
    "even if it stayed private"
  ],
  process_resistance: [
    "when motivation is low",
    "when the spark fades",
    "when I feel stuck",
    "during creative resistance",
    "when I’m not inspired"
  ]
};

// ---------------------------
// Template engine (for “infinite-ish” variants)
// ---------------------------
function fill(template, dict) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const vals = dict[key];
    if (!vals || vals.length === 0) return `{${key}}`;
    return vals.map((v) => String(v)).join("||");
  });
}

function expandTemplate(template, dict, cap = 30) {
  const filled = fill(template, dict);
  const fragments = filled.split(" ");

  let variants = [""];
  for (const frag of fragments) {
    const options = frag.includes("||") ? frag.split("||") : [frag];
    const next = [];
    for (const base of variants) {
      for (const opt of options) {
        next.push((base + " " + opt).trim());
        if (next.length >= cap) break;
      }
      if (next.length >= cap) break;
    }
    variants = next;
    if (variants.length >= cap) break;
  }
  return uniq(variants).slice(0, cap);
}

// ---------------------------
// Slot specs
// ---------------------------
function makeLikertSlot(slotId, stems) {
  return { slotId, variants: stems };
}

// CATEGORY: Identity & Intuition (AI1–AI15)
const AI = [
  makeLikertSlot("AI1", [
    "I create art primarily to express my inner emotional states.",
    "My art begins as an internal feeling that needs form.",
    "Creating art helps me externalize what I feel internally.",
    "Art is how I give shape to my inner life.",
    "I use art as a way to translate internal experience.",
    "My emotional state strongly influences what I create.",
    "Emotion is a core driver of my artistic output.",
    "Art is my primary outlet for internal expression."
  ]),
  makeLikertSlot("AI2", expandTemplate("I would still create art {intrinsic}.", { intrinsic: packs.intrinsic })),
  makeLikertSlot("AI3", [
    "My artwork reflects my emotional landscape.",
    "What I feel internally often appears in my art.",
    "My emotional experiences shape my creative output.",
    "My art mirrors my internal emotional state.",
    "I embed my emotions into my creative work.",
    "My inner world is visible in what I create.",
    "Emotion strongly influences my artistic decisions.",
    "My art carries traces of how I feel."
  ]),
  makeLikertSlot("AI4", [
    "I feel unsettled when I go too long without creating.",
    "Not creating for extended periods affects my well-being.",
    "I feel off-balance when I am unable to make art.",
    "A lack of creative output impacts my emotional state.",
    "I notice discomfort when I suppress creative expression.",
    "Creating regularly feels necessary for my equilibrium.",
    "I experience restlessness when I cannot create.",
    "Creative inactivity affects my internal balance."
  ]),
  makeLikertSlot("AI5", [
    "I instinctively know when a piece is complete.",
    "I rely on intuition to decide when to stop working.",
    "I can sense when a work no longer needs changes.",
    "Completion feels intuitive rather than analytical.",
    "I trust my instincts to judge when a piece is finished.",
    "I feel a natural stopping point while creating.",
    "I recognize completion without needing external input.",
    "I know when further work would detract."
  ]),
  makeLikertSlot("AI6", [
    "I create best when I follow instinct rather than rules.",
    "Intuition guides my creative decisions more than structure.",
    "I prefer instinctive creation over rigid guidelines.",
    "Rules feel secondary to intuition when I create.",
    "I work most fluidly when I trust my instincts.",
    "My best work comes from intuitive decision-making.",
    "I rely more on feeling than formal rules.",
    "Creative flow matters more than procedural correctness."
  ]),
  makeLikertSlot("AI7", [
    "Art feels like a language I think in.",
    "I process thoughts visually rather than verbally.",
    "Creative imagery functions as a thinking tool for me.",
    "I often think in images rather than words.",
    "Visual creation helps me organize my thoughts.",
    "Art serves as a cognitive language for me.",
    "My thinking feels naturally visual.",
    "I use art to reason through ideas."
  ]),
  makeLikertSlot("AI8", [
    "I often see images in my mind before words.",
    "Visual ideas come to me before verbal ones.",
    "My imagination is primarily image-based.",
    "I conceptualize visually before verbalizing.",
    "Mental images precede language for me.",
    "I think in pictures more than words.",
    "Ideas appear as visuals before explanation.",
    "My creativity starts with imagery."
  ]),
  makeLikertSlot("AI9", [
    "My artistic style shifts as my life changes.",
    "Different life phases influence my creative output.",
    "My art evolves alongside personal growth.",
    "Life transitions affect how I create.",
    "My work reflects where I am in life.",
    "Personal change leads to stylistic change.",
    "My creative voice develops over time.",
    "My art mirrors my personal evolution."
  ]),
  makeLikertSlot("AI10", [
    "I feel personally connected to my artwork.",
    "My work feels emotionally tied to me.",
    "I experience attachment to my creative output.",
    "My art feels like an extension of myself.",
    "There is a personal bond between me and my work.",
    "I feel invested in what I create.",
    "My work carries personal significance.",
    "My art feels deeply mine."
  ]),
  makeLikertSlot("AI11", [
    "I use art to process lived experiences.",
    "Creating helps me make sense of what I go through.",
    "Art helps me metabolize experiences into meaning.",
    "I often create to work through events in my life.",
    "My art is a way of processing experience.",
    "I translate experiences into creative form.",
    "I use making as a form of reflection.",
    "Art helps me process what I can’t easily say."
  ]),
  makeLikertSlot("AI12", [
    "My work often feels autobiographical.",
    "My art contains elements of my personal story.",
    "My creative output reflects parts of my life narrative.",
    "I recognize myself inside my work.",
    "My work carries personal history.",
    "My art documents something about my lived experience.",
    "My work feels like a personal record.",
    "My art reflects my own story in some form."
  ]),
  makeLikertSlot("AI13", [
    "I notice recurring themes across my work.",
    "Patterns repeat in my art over time.",
    "I can identify motifs that return in my creations.",
    "My work tends to circle certain themes.",
    "I see consistent threads in my art.",
    "My art shows recognizable patterns.",
    "I observe repeating ideas in what I make.",
    "My creative work returns to similar themes."
  ]),
  makeLikertSlot("AI14", [
    "I trust my creative instincts.",
    "I rely on intuition when making creative choices.",
    "My instincts are a dependable guide in my process.",
    "I feel confident following my creative intuition.",
    "I make decisions based on internal knowing.",
    "I trust my gut in artistic decisions.",
    "I let intuition steer my creative direction.",
    "Instinct plays a central role in my process."
  ]),
  makeLikertSlot("AI15", [
    "Art feels essential to who I am.",
    "Creating feels central to my identity.",
    "I feel most myself when I’m creating.",
    "My identity is strongly tied to making art.",
    "Art feels foundational to my sense of self.",
    "Being an artist feels core to who I am.",
    "Art is part of how I define myself.",
    "Creating feels non-optional for my identity."
  ])
];

// CATEGORY: Process & Discipline (PD1–PD15)
const PD = Array.from({ length: 15 }, (_, i) => i + 1).map((n) => {
  const id = `PD${n}`;
  const map = {
    PD1: [
      "I create on a consistent schedule.",
      "I keep a steady rhythm of making.",
      "I make time for creating regularly.",
      "I create consistently across weeks.",
      "I have a routine that supports creation.",
      "My creative practice is regular.",
      "I return to creating on a reliable cadence.",
      "I maintain consistency in my creative output."
    ],
    PD2: expandTemplate("I can finish work {process_resistance}.", { process_resistance: packs.process_resistance }),
    PD3: [
      "I plan projects before starting.",
      "I prefer to map out a project before I begin.",
      "I usually create a plan or outline first.",
      "I think through structure before execution.",
      "I organize my approach before creating.",
      "I start with planning rather than improvising.",
      "I define steps before I begin a project.",
      "I set a direction before I start making."
    ],
    PD4: [
      "I revise my work intentionally.",
      "I iterate deliberately rather than randomly changing things.",
      "I return to my work to improve it with purpose.",
      "Revision is a planned part of my process.",
      "I refine pieces through deliberate revision.",
      "I review and adjust my work systematically.",
      "I treat revision as part of craftsmanship.",
      "I revise with clear intent."
    ],
    PD5: [
      "I track my creative progress.",
      "I keep records of what I’m learning or producing.",
      "I monitor improvement over time.",
      "I measure my progress in some way.",
      "I track milestones in my creative practice.",
      "I document my creative development.",
      "I keep notes on progress and changes.",
      "I observe progress intentionally."
    ],
    PD6: [
      "I balance experimentation with structure.",
      "I mix playfulness with discipline in my process.",
      "I can explore freely while keeping direction.",
      "I blend creativity and structure effectively.",
      "I maintain structure without losing play.",
      "I allow exploration within a framework.",
      "I keep boundaries that still allow creativity.",
      "I balance freedom and structure when creating."
    ],
    PD7: [
      "I set creative goals.",
      "I define targets for my creative output.",
      "I set intentions for what I want to create.",
      "I create goals for projects or skill growth.",
      "I plan goals for my creative practice.",
      "I work toward defined creative objectives.",
      "I set outcomes I want to reach creatively.",
      "I establish creative goals and pursue them."
    ],
    PD8: [
      "I work through creative resistance.",
      "I can keep going when creating feels hard.",
      "I continue despite inner resistance to creating.",
      "I can move through blocks without quitting.",
      "I push through discomfort to continue creating.",
      "I can create even when I feel reluctant.",
      "I persist through creative friction.",
      "I don’t stop when resistance shows up."
    ],
    PD9: [
      "I can create under time constraints.",
      "I can produce work within short time windows.",
      "I can make progress even when time is limited.",
      "I can create effectively with deadlines.",
      "I can work efficiently when time is tight.",
      "I can adapt my process to limited time.",
      "I can create with constraints on time.",
      "I can deliver creative output under pressure."
    ],
    PD10: [
      "I prefer routines when making art.",
      "I like having consistent habits around creating.",
      "I create best when I have a routine.",
      "Ritual and routine support my creative work.",
      "I’m more productive with a set process.",
      "I prefer predictable rhythms in my practice.",
      "I lean on routine to sustain creation.",
      "I work better with stable creative rituals."
    ],
    PD11: [
      "I reflect on finished pieces.",
      "I analyze my completed work to learn from it.",
      "I review finished work to understand what worked.",
      "I look back on completed pieces thoughtfully.",
      "I evaluate completed work for growth.",
      "I reflect on outcomes after finishing.",
      "I consider lessons from finished work.",
      "I use finished work as feedback."
    ],
    PD12: [
      "I experiment during the process.",
      "I try variations while creating.",
      "I explore options as I work.",
      "I test new approaches mid-process.",
      "I allow experimentation during creation.",
      "I explore alternatives while making.",
      "I experiment as part of my workflow.",
      "I try new things while I create."
    ],
    PD13: [
      "I manage creative burnout effectively.",
      "I notice burnout early and respond to it.",
      "I can recover when I feel creatively depleted.",
      "I have strategies for sustaining long-term creation.",
      "I can pace myself to avoid burnout.",
      "I manage energy to keep creating over time.",
      "I protect my practice from burnout.",
      "I can maintain creativity without burning out."
    ],
    PD14: [
      "I can work through frustration.",
      "I continue creating even when I feel frustrated.",
      "Frustration does not stop me from working.",
      "I can tolerate frustration during creation.",
      "I keep going when the work is irritating.",
      "I don’t quit when frustration appears.",
      "I can stay engaged despite frustration.",
      "I can persist through creative frustration."
    ],
    PD15: [
      "I intentionally develop my skills.",
      "I practice to improve, not just to produce.",
      "I work on skill growth with intention.",
      "I choose exercises that develop capability.",
      "I pursue deliberate skill-building.",
      "I practice with growth as a goal.",
      "I engage in deliberate practice to improve.",
      "I invest effort into improving skill."
    ]
  };

  return makeLikertSlot(id, map[id]);
});

// ---------------------------
// Main generation
// ---------------------------

function loadBlueprintUnwrapped() {
  const p = path.join(__dirname, "..", "data", "tests", "artist_v1.blueprint.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Blueprint not found at: ${p}`);
  }
  const raw = fs.readFileSync(p, "utf-8");
  const parsed = JSON.parse(raw);

  // Unwrap common shapes
  if (parsed?.categories && Array.isArray(parsed.categories)) return parsed;
  if (parsed?.definition?.categories && Array.isArray(parsed.definition.categories)) return parsed.definition;
  if (parsed?.blueprint?.categories && Array.isArray(parsed.blueprint.categories)) return parsed.blueprint;
  if (parsed?.data?.categories && Array.isArray(parsed.data.categories)) return parsed.data;

  console.error("❌ Blueprint top-level keys:", Object.keys(parsed || {}));
  if (parsed?.definition) console.error("❌ Blueprint.definition keys:", Object.keys(parsed.definition || {}));
  throw new Error("artist_v1.blueprint.json does not contain a `categories` array (or known wrapper like definition/blueprint/data).");
}

function collectLikertSlotIdsFromBlueprint(blueprint) {
  const cats = blueprint?.categories;
  if (!Array.isArray(cats)) {
    throw new Error("Blueprint `categories` missing or not an array.");
  }

  const ids = [];
  for (const cat of cats) {
    const qs = cat?.questions;
    if (!Array.isArray(qs)) continue;
    for (const q of qs) {
      // Only bank for likert questions
      if (q?.type === "likert" && q?.questionId) ids.push(q.questionId);
    }
  }
  return ids;
}

function main() {
  const blueprint = loadBlueprintUnwrapped();
  const likertSlotIds = collectLikertSlotIdsFromBlueprint(blueprint);

  // TODO: You will still need MT/CS/EE/GP arrays in this file (same as your original)
  // If you already have them below in your file, keep them.
  // For this shortened fix block, we build only AI+PD if the rest exist in your script.

  const allBanks = [];
  if (typeof AI !== "undefined") allBanks.push(...AI);
  if (typeof PD !== "undefined") allBanks.push(...PD);
  if (typeof MT !== "undefined") allBanks.push(...MT);
  if (typeof CS !== "undefined") allBanks.push(...CS);
  if (typeof EE !== "undefined") allBanks.push(...EE);
  if (typeof GP !== "undefined") allBanks.push(...GP);

  const bank = allBanks.map(({ slotId, variants }) => ({
    slotId,
    variants: clampMinVariants(slotId, variants, 8)
  }));

  const bankIds = new Set(bank.map((b) => b.slotId));
  const missing = likertSlotIds.filter((id) => !bankIds.has(id));
  if (missing.length) {
    throw new Error(`Bank missing ${missing.length} Likert slots from blueprint: ${missing.join(", ")}`);
  }

  const outDir = path.join(__dirname, "..", "data", "tests");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, "artist_v1.bank.json");
  fs.writeFileSync(outPath, JSON.stringify(bank, null, 2), "utf-8");
  console.log(`✅ Generated bank with ${bank.length} slots -> ${outPath}`);
}

main();
