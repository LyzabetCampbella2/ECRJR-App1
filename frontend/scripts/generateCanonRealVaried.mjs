// scripts/generateCanonRealVaried.mjs
// Run: node scripts/generateCanonRealVaried.mjs
// Writes to: src/data/
// Then copy to: public/data/
//
// Outputs:
//  - src/data/all1600_luminaries.json
//  - src/data/all1600_shadows.json
//  - src/data/all900archetypes.json
//  - src/data/lore.index.json
//
// Notes:
// - Luminaries/Shadows now get:
//    • ceremonial long name (name)
//    • short UI call-name (callName)
//    • unique sigil string (sigil) like: ⟠ VELUM-KEYS-0147 · R4K ⟠
//
// - Archetypes keep a simpler name format (can be upgraded later).

import fs from "fs";
import path from "path";

const OUT_DIR = path.join(process.cwd(), "src", "data");
function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
function pad(n, len) {
  return String(n).padStart(len, "0");
}

// -------------------- deterministic RNG --------------------
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seededRand(seedStr) {
  const seed = xmur3(seedStr)();
  return mulberry32(seed);
}
function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}
function pickN(rng, arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    const idx = Math.floor(rng() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

// -------------------- constellations (motif packs) --------------------
const CONSTELLATIONS = [
  {
    id: "C01",
    name: "The Archive",
    core: "truth & memory",
    virtue: "discernment",
    shadows: ["rigidity", "pedantry", "moral grandstanding"],
    motifs: ["ink", "margins", "sealed letters", "catalogues", "testimony"],
    verbs: ["catalogues", "verifies", "cross-references", "preserves"],
    taboo: ["lies for comfort", "erasing inconvenient records", "weaponized receipts"],
    setting: "libraries, ledgers, testimony",
  },
  {
    id: "C02",
    name: "The Forge",
    core: "will & craft",
    virtue: "discipline",
    shadows: ["domination", "brutality", "overwork"],
    motifs: ["steel", "sparks", "tools", "heat", "oaths"],
    verbs: ["builds", "tempers", "shapes", "refines"],
    taboo: ["crushing the apprentice", "calling cruelty ‘standards’", "burning out others"],
    setting: "workshops, studios, steel & oath",
  },
  {
    id: "C03",
    name: "The Garden",
    core: "care & growth",
    virtue: "nurture",
    shadows: ["smothering", "covert control", "martyrdom"],
    motifs: ["soil", "roots", "herbs", "hands", "seasons"],
    verbs: ["cultivates", "tends", "prunes", "restores"],
    taboo: ["helping without consent", "raising dependency", "love as leverage"],
    setting: "orchards, clinics, classrooms",
  },
  {
    id: "C04",
    name: "The Court",
    core: "order & judgment",
    virtue: "fairness",
    shadows: ["cruel certainty", "punitive purity", "status law"],
    motifs: ["gavel", "ledger", "seal", "witness chair", "contracts"],
    verbs: ["adjudicates", "balances", "holds line", "sentences"],
    taboo: ["punishment as ego", "moving goalposts", "humiliation"],
    setting: "tribunals, councils, rules",
  },
  {
    id: "C05",
    name: "The Lantern",
    core: "insight & guidance",
    virtue: "clarity",
    shadows: ["self-importance", "condescension", "false certainty"],
    motifs: ["maps", "lamplight", "chalk", "questions", "trail marks"],
    verbs: ["illuminates", "questions", "guides", "names"],
    taboo: ["guiding without listening", "confusing cleverness with wisdom", "blinding truth"],
    setting: "maps, beacons, inquiry",
  },
  {
    id: "C06",
    name: "The Mirror",
    core: "identity & reflection",
    virtue: "honesty",
    shadows: ["vanity", "performance", "self-erasure"],
    motifs: ["glass", "portraits", "stages", "confessionals", "signatures"],
    verbs: ["reflects", "reveals", "names", "reframes"],
    taboo: ["curating truth", "stealing the spotlight", "splitting self"],
    setting: "portraits, stages, confession",
  },
  {
    id: "C07",
    name: "The Tide",
    core: "emotion & belonging",
    virtue: "empathy",
    shadows: ["fusing", "people-pleasing", "emotional blackmail"],
    motifs: ["salt", "shore", "letters home", "warmth", "storm-swell"],
    verbs: ["attunes", "holds", "softens", "connects"],
    taboo: ["merging as love", "guilt as glue", "abandoning self"],
    setting: "shorelines, family systems",
  },
  {
    id: "C08",
    name: "The Storm",
    core: "change & rupture",
    virtue: "courage",
    shadows: ["recklessness", "chaos addiction", "scorched earth"],
    motifs: ["thunder", "broken gates", "new names", "smoke", "running"],
    verbs: ["breaks", "restarts", "liberates", "disrupts"],
    taboo: ["breaking for sport", "burning bridges for control", "calling avoidance ‘freedom’"],
    setting: "rebellion, reinvention",
  },
  {
    id: "C09",
    name: "The Veil",
    core: "mystery & secrecy",
    virtue: "prudence",
    shadows: ["avoidance", "manipulation", "paranoia"],
    motifs: ["masks", "corridors", "whispers", "keys", "double-doors"],
    verbs: ["withholds", "protects", "waits", "tests"],
    taboo: ["secrecy as power", "ghosting repair", "punishing questions"],
    setting: "whispers, cover stories",
  },
  {
    id: "C10",
    name: "The Compass",
    core: "purpose & direction",
    virtue: "commitment",
    shadows: ["tunnel-vision", "fanaticism", "moral tradeoffs"],
    motifs: ["north marks", "routes", "pilgrims", "vows", "mile-stones"],
    verbs: ["commits", "chooses", "stays", "returns"],
    taboo: ["ends justify means", "discarding people", "mission over ethics"],
    setting: "pilgrimage, mission",
  },
  {
    id: "C11",
    name: "The Hearth",
    core: "home & loyalty",
    virtue: "steadiness",
    shadows: ["stagnation", "clannishness", "fear of change"],
    motifs: ["candles", "recipes", "old songs", "thresholds", "keys"],
    verbs: ["keeps", "hosts", "protects", "grounds"],
    taboo: ["loyalty as prison", "tradition over truth", "silencing conflict"],
    setting: "rituals, tradition",
  },
  {
    id: "C12",
    name: "The Crescent",
    core: "beauty & restraint",
    virtue: "refinement",
    shadows: ["withholding", "snobbery", "coldness"],
    motifs: ["silk", "calligraphy", "tea", "quiet rooms", "manners"],
    verbs: ["refines", "edits", "selects", "polishes"],
    taboo: ["withholding affection", "beauty as exclusion", "judging the untrained"],
    setting: "salons, etiquette",
  },
  {
    id: "C13",
    name: "The Loom",
    core: "connection & systems",
    virtue: "integration",
    shadows: ["over-engineering", "control-by-system", "detachment"],
    motifs: ["threads", "diagrams", "networks", "protocols", "knots"],
    verbs: ["weaves", "maps", "integrates", "links"],
    taboo: ["people as parts", "system over soul", "optimizing love away"],
    setting: "networks, protocols",
  },
  {
    id: "C14",
    name: "The Summit",
    core: "ambition & mastery",
    virtue: "excellence",
    shadows: ["contempt", "elitism", "never-enough"],
    motifs: ["peaks", "cold air", "medals", "timelines", "training"],
    verbs: ["masters", "trains", "tests", "elevates"],
    taboo: ["contempt as motivation", "humiliating learners", "success as worth"],
    setting: "high standards, peak work",
  },
  {
    id: "C15",
    name: "The Hollow",
    core: "loss & meaning",
    virtue: "acceptance",
    shadows: ["nihilism", "emotional numbness", "bitterness"],
    motifs: ["ashes", "farewells", "empty chairs", "elegies", "winter fields"],
    verbs: ["grieves", "releases", "names", "endures"],
    taboo: ["punishing joy", "romanticizing pain", "refusing help"],
    setting: "grief-work, endings",
  },
  {
    id: "C16",
    name: "The Dawn",
    core: "hope & renewal",
    virtue: "faith-in-action",
    shadows: ["naïveté", "denial", "toxic positivity"],
    motifs: ["first light", "fresh paper", "new vows", "springs", "open doors"],
    verbs: ["begins", "revives", "forgives", "tries again"],
    taboo: ["denying harm", "skipping accountability", "hope without action"],
    setting: "second chances, vows",
  },
];

const ROLE_ARCH = [
  "Strategist","Mediator","Chronicler","Sentinel","Cartographer","Artificer","Healer","Adjudicator",
  "Navigator","Steward","Scholar","Vanguard","Emissary","Architect","Conductor","Witness",
];
const ROLE_LUM = [
  "Beacon","Anchor","Clarifier","Harmonizer","Protector","Builder","Mentor","Interpreter",
  "Wayfinder","Restorer","Catalyst","Gardener","Advocate","Refiner","Integrator","Inheritor",
];
const ROLE_SHD = [
  "Saboteur","Distorter","Withholder","Controller","Doubter","Prosecutor","Escapist","Provoker",
  "Mask","Addictor","Usurper","Martyr","Hoarder","Perfectionist","Chameleon","Rebel",
];

const VIRTUES = [
  "patience","discipline","courage","discernment","mercy","integrity","restraint","curiosity",
  "loyalty","humility","clarity","steadiness","tenderness","precision","resolve","honor",
];
const WOUNDS = [
  "betrayal","abandonment","humiliation","invisibility","chaos","rejection","powerlessness","shame",
  "grief","exposure","failure","scarcity","conflict","disappointment","loneliness","misrecognition",
];
const GIFTS = [
  "pattern-reading","truth-telling","protective devotion","quiet leadership","inventive craft","relational repair",
  "calm focus","ethical backbone","imaginative synthesis","strategic patience","beautiful restraint","courageous honesty",
  "resource stewardship","deep listening","system sense","creative grit",
];
const FEARS = [
  "being trapped","being exposed","being irrelevant","hurting others","making the wrong call","losing control",
  "being ordinary","being owned","being misunderstood","being too late","being abandoned","being powerless",
  "being indebted","being ridiculed","being outmatched","being forgotten",
];

// -------------------- UNIQUE NAME SYSTEM (Lum/Shadow) --------------------
const SYL_A = [
  "Ae","Al","An","Ar","Au","Be","Ca","Ce","Cor","Da","De","El","Em","Eir","Fa","Fi","Ga","Ha",
  "Ia","Il","Is","Ka","Ke","La","Le","Li","Lo","Lu","Ma","Me","Mi","Na","Ne","No","Ny","O","Or",
  "Pa","Pe","Qua","Ra","Re","Ri","Sa","Se","Si","Sol","Ta","Te","Th","Ul","Va","Ve","Vi","Vo","Wy","Xa","Ya","Ze",
];
const SYL_B = [
  "dr","l","m","n","r","s","th","v","w","x","z","nd","nt","st","sh","ch","ph","rh",
  "vr","vl","gr","gl","kr","kl","tr","tl","br","bl","mn","rn",
];
const SYL_C = ["a","e","i","o","u","ae","ia","io","oa","ui","y","ei","ou","au"];
const SYL_D = ["n","r","s","th","l","m","d","t","k","x","v","z","rn","rs","nd","nt","st","sh","ch","ph","lm","lk","nx","vr"];

function makeProperName(seedStr) {
  const rng = seededRand(`proper|${seedStr}`);
  const syllCount = 2 + Math.floor(rng() * 3); // 2–4
  const parts = [];
  for (let i = 0; i < syllCount; i++) {
    const a = pick(rng, SYL_A);
    const b = rng() < 0.55 ? pick(rng, SYL_B) : "";
    const c = pick(rng, SYL_C);
    const d = rng() < 0.65 ? pick(rng, SYL_D) : "";
    parts.push(`${a}${b}${c}${d}`);
  }
  let name = parts.join("");
  name = name.replace(/aa|ee|ii|oo|uu/g, (m) => m[0]);
  name = name.charAt(0).toUpperCase() + name.slice(1);

  if (rng() < 0.35) {
    const ext = makeProperName(`ext|${seedStr}`);
    name = `${name} ${ext.split(" ")[0]}`;
  }
  return name;
}

function makeCallName(seedStr) {
  const base = makeProperName(`call|${seedStr}`);
  return base.split(" ")[0];
}

const ORDER_PREFIX = {
  C01: "Archivum",
  C02: "Ferrum",
  C03: "Verdantia",
  C04: "Curia",
  C05: "Lucerna",
  C06: "Speculum",
  C07: "Aestuarium",
  C08: "Tempestas",
  C09: "Velum",
  C10: "Borealis",
  C11: "Focus",
  C12: "Crescentia",
  C13: "Textum",
  C14: "Culmen",
  C15: "Cavum",
  C16: "Aurora",
};

const LUM_TITLES = [
  "The Beacon","The Keeper","The First Light","The Steady Hand","The Quiet Star",
  "The True Witness","The Lantern-Bearer","The Boundaried Heart","The Clear Voice","The Patient Blade",
];
const SHD_TITLES = [
  "The Withholder","The Pale Judge","The Thorned Tongue","The Hidden Knife","The False Mirror",
  "The Black Ledger","The Salt Wound","The Locked Door","The Crooked Compass","The Drowned Bell",
];

const LUM_FORMS = ["Vow","Canticle","Index","Codex","Thesis","Atlas","Protocol","Covenant","Syllabus","Glossary"];
const SHD_FORMS = ["Edict","Accusation","Writ","Verdict","Cipher","Ration","Ruin","Ruse","Debt","Mask"];

function uniqueEpithet(kind, c, rng) {
  const motifA = pick(rng, c.motifs);
  const motifB = pick(rng, c.motifs);
  const verb = pick(rng, c.verbs);
  const taboo = pick(rng, c.taboo);

  const lumEnds = [
    `who ${verb} the ${motifA}`,
    `of ${motifA} and ${motifB}`,
    `bound by ${motifA}`,
    `in ${motifB}-light`,
    `with the ${motifA} oath`,
  ];
  const shdEnds = [
    `who keeps the ${motifA} locked`,
    `of ${motifA} and quiet threat`,
    `that turns ${motifB} into leverage`,
    `who makes “${taboo}” feel holy`,
    `behind the ${motifA} mask`,
  ];
  return kind === "luminary" ? pick(rng, lumEnds) : pick(rng, shdEnds);
}

function makeLuminaryName(id, c) {
  const rng = seededRand(`lumname|${id}|${c.id}`);
  const proper = makeProperName(id);
  const order = ORDER_PREFIX[c.id] || c.id;
  const title = pick(rng, LUM_TITLES);
  const form = pick(rng, LUM_FORMS);
  const motif = pick(rng, c.motifs);
  const epi = uniqueEpithet("luminary", c, rng);
  return `${title}: ${proper} of ${order} — ${form} of ${motif}, ${epi}`;
}

function makeShadowName(id, c) {
  const rng = seededRand(`shdname|${id}|${c.id}`);
  const proper = makeProperName(id);
  const order = ORDER_PREFIX[c.id] || c.id;
  const title = pick(rng, SHD_TITLES);
  const form = pick(rng, SHD_FORMS);
  const motif = pick(rng, c.motifs);
  const epi = uniqueEpithet("shadow", c, rng);
  return `${title}: ${proper} of ${order} — ${form} of ${motif}, ${epi}`;
}

// -------------------- SIGILS --------------------
const CONSTELLATION_CODE = {
  C01: "ARCHIVE",
  C02: "FORGE",
  C03: "GARDEN",
  C04: "COURT",
  C05: "LANTERN",
  C06: "MIRROR",
  C07: "TIDE",
  C08: "STORM",
  C09: "VELUM",
  C10: "COMPASS",
  C11: "HEARTH",
  C12: "CRESCENT",
  C13: "LOOM",
  C14: "SUMMIT",
  C15: "HOLLOW",
  C16: "DAWN",
};

function motifToken(m) {
  return String(m || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 18);
}

function makeRune(seedStr) {
  const rng = seededRand(`rune|${seedStr}`);
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const len = 3 + Math.floor(rng() * 3); // 3–5
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(rng() * alphabet.length)];
  return out;
}

function makeSigil({ kind, id, idx, constellationId, motifs }) {
  const rng = seededRand(`sigil|${kind}|${id}|${constellationId}`);
  const constCode = CONSTELLATION_CODE[constellationId] || constellationId;
  const motifA = motifToken(pick(rng, motifs));
  const motifB = motifToken(pick(rng, motifs));
  const n = String(idx).padStart(4, "0");
  const rune = makeRune(`${kind}|${id}|${constellationId}`);
  if (rng() < 0.5) return `⟠ ${constCode}-${motifA}-${n} · ${rune} ⟠`;
  return `⟠ ${constCode}-${motifA}-${motifB}-${n} · ${rune} ⟠`;
}

// -------------------- Archetype naming (kept simpler) --------------------
const ARCH_NOUNS = [
  "Thesis","Treatise","Codex","Monograph","Ledger","Chronicle","Doctrine","Atlas",
  "Index","Archive","Protocol","Covenant","Syllabus","Ritual","Psalter","Glossary",
];
const ARCH_EPITHETS = [
  "of Quiet Steel","of the Long View","of Glass & Ink","of the Green Lamp","of Oath and Orchard",
  "of Measured Fire","of Salt and Silk","of Winter Paper","of Red Thread","of Dark Water",
  "of Ivory Hours","of Blue Smoke","of the Unbroken Line","of the Hidden Stair","of the Open Door","of the Last Light",
];
function makeArchetypeName(id, c) {
  const rng = seededRand(`archname|${id}|${c.id}`);
  const role = pick(rng, ROLE_ARCH);
  const noun = pick(rng, ARCH_NOUNS);
  const epi = pick(rng, ARCH_EPITHETS);
  const motif = pick(rng, c.motifs);
  return `${role}'s ${noun} ${epi} — ${c.name} (${motif})`;
}

// -------------------- domains / signals / lore --------------------
function mkDomains(kind, c, rng) {
  const psychTemplates = {
    archetype: [
      `Identity organizes around ${c.core}; maturity is ${c.virtue}, strain slides into ${pick(rng, c.shadows)}.`,
      `This pattern stabilizes through ${c.virtue}; when threatened it clings to certainty and over-functions.`,
      `A meaning-maker: it seeks coherence in ${c.core}; dysregulation shows up as rigidity and reactivity.`,
    ],
    luminary: [
      `Integrated expression strengthens regulation: ${c.virtue} becomes a nervous-system anchor.`,
      `Leads from steadiness; under stress it over-carries, mistaking responsibility for love.`,
      `A stabilizer archetype: attunement first, action second—then clean repair.`,
    ],
    shadow: [
      `Defense against pain in ${c.core}: it reaches for ${pick(rng, c.shadows)} to feel safe.`,
      `Protects the wound by shrinking the world; vigilance replaces curiosity.`,
      `A threat-scanner: it mislabels discomfort as danger and reacts fast.`,
    ],
  };

  const socTemplates = {
    archetype: [
      `In groups it sets tone: it ${pick(rng, c.verbs)} norms and expects reciprocity.`,
      `Social signature is “quiet authority”: people follow because it’s consistent.`,
      `Often becomes the standard-setter—sometimes without realizing it.`,
    ],
    luminary: [
      `Builds trust through consistency; creates containers where others can grow.`,
      `Turns conflict into structure: listening, naming, then boundary.`,
      `It models repair instead of performance.`,
    ],
    shadow: [
      `Escalates status tension: tests loyalty, audits intention, keeps score.`,
      `Pushes/pulls closeness; intensity substitutes for safety.`,
      `Treats uncertainty as betrayal; seeks control through narratives.`,
    ],
  };

  const pedTemplates = {
    archetype: [
      `Learns best via practice loops + clear criteria; resists vague feedback.`,
      `Thrives with mentorship and responsibility; hates being managed without respect.`,
      `Prefers “show me the structure” learning: exemplars, rubrics, iteration.`,
    ],
    luminary: [
      `Teaches by modeling; gives precise feedback without humiliation.`,
      `Learns by serving a craft: repetition, reflection, refinement.`,
      `Needs challenge + rest; mastery is paced.`,
    ],
    shadow: [
      `Shame-sensitive; improves with containment, consent, and specific next steps.`,
      `Rejects instruction when it feels like domination; needs autonomy scaffolds.`,
      `Learns through safe experiments; spirals if punished for trying.`,
    ],
  };

  const anthTemplates = [
    `Across cultures it resembles roles found in ${c.name}'s imagery—${pick(rng, c.motifs)} and ${pick(rng, c.motifs)} as symbols of authority.`,
    `Historically this shows up in ${c.setting}: the one entrusted with boundaries and meaning.`,
    `Mythically tied to ${pick(rng, c.motifs)}—a sign that the role carries taboo and duty.`,
  ];

  const key = kind === "luminary" ? "luminary" : kind === "shadow" ? "shadow" : "archetype";
  return {
    psychology: { notes: pick(rng, psychTemplates[key]), signals: [] },
    sociology: { notes: pick(rng, socTemplates[key]), signals: [] },
    pedagogy: { notes: pick(rng, pedTemplates[key]), signals: [] },
    anthropology: { notes: pick(rng, anthTemplates), signals: [] },
  };
}

function mkSignals(kind, c, virtue, wound, gift, fear, rng) {
  const oathLines = [
    `Oath: “I will not trade truth for comfort.”`,
    `Oath: “I will not confuse control with care.”`,
    `Oath: “I will build slowly, not violently.”`,
    `Oath: “I will repair what I rupture.”`,
    `Oath: “I will not make my wound a law.”`,
    `Oath: “I will keep my ethics when it’s expensive.”`,
  ];
  const paradoxLines = [
    `Paradox: the more it chases certainty, the less safe it feels.`,
    `Paradox: its strength becomes a weapon when it’s afraid.`,
    `Paradox: it demands what it refuses to receive.`,
    `Paradox: it protects others by hiding from them.`,
    `Paradox: it confuses intensity with intimacy.`,
  ];
  const tabooLine = `Taboo: ${pick(rng, c.taboo)}.`;

  if (kind === "luminary") {
    return {
      gifts: [
        `Turns ${wound} into steadiness rather than spectacle.`,
        `Carries ${virtue} like a lantern: visible, not blinding.`,
        `Uses ${gift} to make rooms safer.`,
        pick(rng, oathLines),
      ],
      strengths: pickN(rng, [
        `Clean boundaries with warmth.`,
        `Precision without humiliation.`,
        `Crisis calm (breath first, action second).`,
        `Ethical consistency over charisma.`,
        `Deep listening that changes outcomes.`,
      ], 3),
      risks: pickN(rng, [
        `Over-functioning: doing too much for too long.`,
        `Becoming the “responsible one” instead of a whole person.`,
        `Avoiding softness to stay respected.`,
        `Carrying others’ fear like it’s a duty.`,
      ], 2),
      triggers: pickN(rng, [
        `Being misread as weak.`,
        `Moving goalposts / unclear expectations.`,
        `Public shaming.`,
        `People who demand intimacy without trust.`,
      ], 2),
      growth: pickN(rng, [
        `Ask consent before helping.`,
        `Let rest be part of discipline.`,
        `Name needs plainly.`,
        `Practice repair fast, not perfect.`,
      ], 3),
      relationships: [`Bonds through reliability; trust comes before intensity.`, pick(rng, paradoxLines)],
      signature: [tabooLine],
    };
  }

  if (kind === "shadow") {
    return {
      gifts: [
        `Detects inconsistency early; the alarm is real.`,
        `Refuses false safety when the wound is ${wound}.`,
        tabooLine,
      ],
      strengths: pickN(rng, [
        `Sees weak points in plans.`,
        `Names hypocrisy fast.`,
        `High threat sensitivity (useful in real danger).`,
        `Can be fiercely loyal once trust is earned.`,
      ], 3),
      risks: [
        `Fear of ${fear} turns into accusation.`,
        `Punishes closeness pre-emptively.`,
        pick(rng, paradoxLines),
      ],
      triggers: pickN(rng, [
        `Ambiguity that feels like a trap.`,
        `Being compared or dismissed.`,
        `Rules changing without explanation.`,
        `People who weaponize “nice.”`,
      ], 3),
      growth: pickN(rng, [
        `Replace “prove it” with “build it.”`,
        `Move from accusation to request.`,
        `Repair after rupture (even if small).`,
        `Let one safe person witness the truth.`,
      ], 3),
      relationships: [`Tests loyalty; needs consistency + boundaries.`, pick(rng, oathLines)],
      signature: [`Rule: never make the wound the judge.`],
    };
  }

  return {
    gifts: [
      `Builds identity around ${c.core} with ${virtue}.`,
      `Makes meaning from ${wound} without worshipping it.`,
      pick(rng, oathLines),
    ],
    strengths: pickN(rng, [
      `Strategic patience.`,
      `High discernment.`,
      `Stable standards.`,
      `Courage to name the real problem.`,
      `System sense: sees downstream consequences.`,
    ], 3),
    risks: pickN(rng, [
      `When afraid of ${fear}, it hardens.`,
      `Becomes performative instead of present.`,
      `Uses standards to avoid vulnerability.`,
      `Confuses self-control with virtue.`,
    ], 2),
    triggers: pickN(rng, [
      `Being misrecognized.`,
      `Lack of reciprocity.`,
      `Chaos without repair.`,
      `Authority without ethics.`,
    ], 2),
    growth: pickN(rng, [
      `Trade perfection for honest iteration.`,
      `Ask for support before collapse.`,
      `Hold boundaries without contempt.`,
      `Keep one promise to yourself daily.`,
    ], 3),
    relationships: [
      `Seeks respect before intimacy; needs both.`,
      tabooLine,
      pick(rng, paradoxLines),
    ],
    signature: [`Signature: ${pick(rng, c.motifs)} + ${pick(rng, c.motifs)} imagery recurs in their story.`],
  };
}

function loreBlocks(kind, name, c, virtue, wound, gift, fear, role, rng) {
  const openers = [
    `There is a way ${name} arrives: not loudly—decisively.`,
    `${name} is not a personality; it is a pattern under pressure.`,
    `You recognize ${name} by what it refuses to do.`,
    `In the ${c.name}, ${name} is the one who stays when others perform.`,
    `${name} does not chase attention. It chases alignment.`,
  ];
  const socialFrames = [
    `Socially, it moves as the ${role}:`,
    `In rooms and relationships, it becomes the ${role}:`,
    `When witnessed by others, it reads like a ${role}:`,
  ];
  const pressureFrames = [
    `Under stress, the nervous system makes a bargain:`,
    `Pressure reveals the contract it made with pain:`,
    `When threatened, it returns to the oldest strategy:`,
  ];
  const integrationFrames = [
    `Integration looks like clean language and smaller drama.`,
    `Maturity is not softness; it is precision without cruelty.`,
    `Mastery is this: ethics that survive exhaustion.`,
    `Healing is choosing the virtue without using it as a weapon.`,
  ];

  const A = {
    label: "A",
    summary: `Core: ${c.core} → ${virtue}.`,
    long:
      `${pick(rng, openers)} ` +
      `It organizes identity around ${c.core}, with ${pick(rng, c.motifs)}-imagery threading through its choices. ` +
      `At its best, it practices ${virtue} in public and private. ` +
      `The gift is ${gift}, and it shows up as a habit—not a moment.`,
    cues: [`Motif: ${pick(rng, c.motifs)}`, `Virtue: ${virtue}`, `Gift: ${gift}`],
    tone: kind === "shadow" ? "wound/defense" : "refined/constructive",
  };

  const B = {
    label: "B",
    summary: `Role: ${role} in motion.`,
    long:
      `${pick(rng, socialFrames)} it ${pick(rng, c.verbs)} what’s implicit. ` +
      `In ${c.setting}, it often becomes the quiet standard-setter—sometimes reluctantly. ` +
      `When aligned, it offers clarity and consent. When misaligned, it mistakes restraint for love and calls distance “principle.”`,
    cues: [
      `Social tell: ${pick(rng, ["measured voice", "careful timing", "controlled warmth", "precise words", "calm authority"])}`,
      `Setting: ${c.setting}`,
    ],
    tone: "social",
  };

  const C = {
    label: "C",
    summary: `Pressure: wound of ${wound}; fear of ${fear}.`,
    long:
      `${pick(rng, pressureFrames)} it tries to prevent ${fear}. ` +
      `The wound is ${wound}, so it becomes vigilant about tone, intent, and reciprocity. ` +
      `This is where the pattern can turn sharp: it makes rules out of pain, and it forgets repair. ` +
      `If unintegrated, it begins to punish what it actually longs for.`,
    cues: [`Wound: ${wound}`, `Fear: ${fear}`, `Shadow style: ${pick(rng, c.shadows)}`],
    tone: "fracture",
  };

  const D = {
    label: "D",
    summary: `Integration: virtue with warmth; boundaries with repair.`,
    long:
      `${pick(rng, integrationFrames)} ` +
      `${name} becomes real when it stops using control as a substitute for safety. ` +
      `It chooses ${virtue} without contempt, sets boundaries without spectacle, and repairs quickly when it misses. ` +
      `Its legacy is steadiness: a life that matches its own ethics.`,
    cues: [`Practice: boundary + repair`, `Legacy: steadiness`, `Taboo to avoid: ${pick(rng, c.taboo)}`],
    tone: "integration",
  };

  return { A, B, C, D };
}

// -------------------- builders --------------------
function buildLuminaries(count = 800) {
  const list = [];
  for (let i = 1; i <= count; i++) {
    const id = `lum_${pad(i, 4)}`;
    const tag = `LUM_${pad(i, 4)}`;
    const c = CONSTELLATIONS[(i - 1) % CONSTELLATIONS.length];
    const rng = seededRand(`${id}|${c.id}`);

    const virtue = pick(rng, VIRTUES);
    const wound = pick(rng, WOUNDS);
    const gift = pick(rng, GIFTS);
    const fear = pick(rng, FEARS);
    const role = pick(rng, ROLE_LUM);

    const name = makeLuminaryName(id, c);
    const callName = makeCallName(id);
    const sigil = makeSigil({ kind: "luminary", id, idx: i, constellationId: c.id, motifs: c.motifs });

    list.push({
      id,
      kind: "luminary",
      tag,
      name,
      callName,
      sigil,
      aliases: [],
      constellation: c.id,
      domains: mkDomains("luminary", c, rng),
      signals: mkSignals("luminary", c, virtue, wound, gift, fear, rng),
      lore: loreBlocks("luminary", name, c, virtue, wound, gift, fear, role, rng),
      ui: { icon: "star", colorHint: "light" },
      meta: { version: 5, createdBy: "canon-realizer-varied-unique-names+sigils" },
    });
  }
  return list;
}

function buildShadows(count = 800) {
  const list = [];
  for (let i = 1; i <= count; i++) {
    const id = `shd_${pad(i, 4)}`;
    const tag = `SHD_${pad(i, 4)}`;
    const c = CONSTELLATIONS[(i + 7) % CONSTELLATIONS.length];
    const rng = seededRand(`${id}|${c.id}`);

    const virtue = c.virtue;
    const wound = pick(rng, WOUNDS);
    const gift = pick(rng, GIFTS);
    const fear = pick(rng, FEARS);
    const role = pick(rng, ROLE_SHD);

    const name = makeShadowName(id, c);
    const callName = makeCallName(id);
    const sigil = makeSigil({ kind: "shadow", id, idx: i, constellationId: c.id, motifs: c.motifs });

    list.push({
      id,
      kind: "shadow",
      tag,
      name,
      callName,
      sigil,
      aliases: [],
      constellation: c.id,
      domains: mkDomains("shadow", c, rng),
      signals: mkSignals("shadow", c, virtue, wound, gift, fear, rng),
      lore: loreBlocks("shadow", name, c, virtue, wound, gift, fear, role, rng),
      ui: { icon: "moon", colorHint: "dark" },
      meta: { version: 5, createdBy: "canon-realizer-varied-unique-names+sigils" },
    });
  }
  return list;
}

function buildArchetypes(count = 900, lumCount = 800, shdCount = 800) {
  const list = [];
  for (let i = 1; i <= count; i++) {
    const id = `arch_${pad(i, 3)}`;
    const tag = `ARCH_${pad(i, 3)}`;
    const c = CONSTELLATIONS[(i - 1) % CONSTELLATIONS.length];
    const rng = seededRand(`${id}|${c.id}`);

    const virtue = c.virtue;
    const wound = pick(rng, WOUNDS);
    const gift = pick(rng, GIFTS);
    const fear = pick(rng, FEARS);
    const role = pick(rng, ROLE_ARCH);

    const name = makeArchetypeName(id, c);

    const lumA = ((i * 7) % lumCount) + 1;
    const lumB = ((i * 13) % lumCount) + 1;
    const shdA = ((i * 9) % shdCount) + 1;
    const shdB = ((i * 17) % shdCount) + 1;

    list.push({
      id,
      kind: "archetype",
      tag,
      name,
      subtitle: `A ${c.core} archetype: ${virtue} when integrated; ${pick(rng, c.shadows)} when afraid.`,
      constellation: c.id,
      luminaryTags: [`LUM_${pad(lumA, 4)}`, `LUM_${pad(lumB, 4)}`],
      shadowTags: [`SHD_${pad(shdA, 4)}`, `SHD_${pad(shdB, 4)}`],
      domains: mkDomains("archetype", c, rng),
      signals: mkSignals("archetype", c, virtue, wound, gift, fear, rng),
      lore: loreBlocks("archetype", name, c, virtue, wound, gift, fear, role, rng),
      ui: { icon: "sigil", colorHint: "neutral" },
      meta: { version: 5, createdBy: "canon-realizer-varied-unique-names+sigils" },
    });
  }
  return list;
}

function buildLoreIndex(archetypes, luminaries, shadows) {
  const toIndex = (x) => ({
    id: x.id,
    kind: x.kind,
    tag: x.tag,
    name: x.name,
    constellation: x.constellation,
    subtitle: x.subtitle || "",
    keywords: Array.from(new Set([
      x.name,
      x.callName,
      x.sigil,
      x.tag,
      x.constellation,
      x.subtitle,
      ...(x.aliases || []),
    ].filter(Boolean))),
  });
  return [...archetypes.map(toIndex), ...luminaries.map(toIndex), ...shadows.map(toIndex)];
}

function writeJson(filename, data) {
  ensureDir(OUT_DIR);
  const outPath = path.join(OUT_DIR, filename);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf8");
  console.log(`✅ Wrote ${filename} (${Array.isArray(data) ? data.length : "object"})`);
}

function main() {
  const luminaries = buildLuminaries(800);
  const shadows = buildShadows(800);
  const archetypes = buildArchetypes(900, 800, 800);
  const loreIndex = buildLoreIndex(archetypes, luminaries, shadows);

  writeJson("all1600_luminaries.json", luminaries);
  writeJson("all1600_shadows.json", shadows);
  writeJson("all900archetypes.json", archetypes);
  writeJson("lore.index.json", loreIndex);

  console.log("🎯 Done. Luminaries/Shadows now include callName + sigil (unique, stable).");
  console.log("Next: copy src/data/*.json to public/data/*.json");
}

main();
