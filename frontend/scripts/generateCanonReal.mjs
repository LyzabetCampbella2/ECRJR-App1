// scripts/generateCanonReal.mjs
// Run: node scripts/generateCanonReal.mjs
// Outputs:
//  - src/data/all1600_luminaries.json
//  - src/data/all1600_shadows.json
//  - src/data/all900archetypes.json
//  - src/data/lore.index.json

import fs from "fs";
import path from "path";

const OUT_DIR = path.join(process.cwd(), "src", "data");
function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
function pad(n, len) { return String(n).padStart(len, "0"); }
function pick(arr, n) { return arr[((n % arr.length) + arr.length) % arr.length]; }
function hashNum(seedStr) {
  // lightweight deterministic hash -> number
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// --------- World tone + lexicons (modern academia, refined, mythic) ----------
const CONSTELLATIONS = [
  { id: "C01", name: "The Archive", core: "truth & memory", virtue: "discernment", vice: "rigidity", setting: "libraries, ledgers, testimony" },
  { id: "C02", name: "The Forge", core: "will & craft", virtue: "discipline", vice: "domination", setting: "workshops, studios, steel & oath" },
  { id: "C03", name: "The Garden", core: "care & growth", virtue: "nurture", vice: "control-by-kindness", setting: "orchards, clinics, classrooms" },
  { id: "C04", name: "The Court", core: "order & judgment", virtue: "fairness", vice: "cruel certainty", setting: "tribunals, councils, rules" },
  { id: "C05", name: "The Lantern", core: "insight & guidance", virtue: "clarity", vice: "self-importance", setting: "maps, beacons, inquiry" },
  { id: "C06", name: "The Mirror", core: "identity & reflection", virtue: "honesty", vice: "vanity", setting: "portraits, stages, confession" },
  { id: "C07", name: "The Tide", core: "emotion & belonging", virtue: "empathy", vice: "fusing", setting: "shorelines, family systems" },
  { id: "C08", name: "The Storm", core: "change & rupture", virtue: "courage", vice: "recklessness", setting: "rebellion, reinvention" },
  { id: "C09", name: "The Veil", core: "mystery & secrecy", virtue: "prudence", vice: "avoidance", setting: "whispers, cover stories" },
  { id: "C10", name: "The Compass", core: "purpose & direction", virtue: "commitment", vice: "tunnel-vision", setting: "pilgrimage, mission" },
  { id: "C11", name: "The Hearth", core: "home & loyalty", virtue: "steadiness", vice: "stagnation", setting: "rituals, tradition" },
  { id: "C12", name: "The Crescent", core: "beauty & restraint", virtue: "refinement", vice: "withholding", setting: "salons, etiquette" },
  { id: "C13", name: "The Loom", core: "connection & systems", virtue: "integration", vice: "over-engineering", setting: "networks, protocols" },
  { id: "C14", name: "The Summit", core: "ambition & mastery", virtue: "excellence", vice: "contempt", setting: "high standards, peak work" },
  { id: "C15", name: "The Hollow", core: "loss & meaning", virtue: "acceptance", vice: "nihilism", setting: "grief-work, endings" },
  { id: "C16", name: "The Dawn", core: "hope & renewal", virtue: "faith-in-action", vice: "naïveté", setting: "second chances, vows" },
];

const ROLE_ARCH = [
  "Strategist", "Mediator", "Chronicler", "Sentinel", "Cartographer", "Artificer",
  "Healer", "Adjudicator", "Navigator", "Steward", "Scholar", "Vanguard",
  "Emissary", "Architect", "Conductor", "Witness",
];
const ROLE_LUM = [
  "Beacon", "Anchor", "Clarifier", "Harmonizer", "Protector", "Builder",
  "Mentor", "Interpreter", "Wayfinder", "Restorer", "Catalyst", "Gardener",
  "Advocate", "Refiner", "Integrator", "Inheritor",
];
const ROLE_SHD = [
  "Saboteur", "Distorter", "Withholder", "Controller", "Doubter", "Prosecutor",
  "Escapist", "Provoker", "Mask", "Addictor", "Usurper", "Martyr",
  "Hoarder", "Perfectionist", "Chameleon", "Rebel",
];

const VIRTUES = [
  "patience", "discipline", "courage", "discernment", "mercy", "integrity",
  "restraint", "curiosity", "loyalty", "humility", "clarity", "steadiness",
  "tenderness", "precision", "resolve", "honor",
];
const WOUNDS = [
  "betrayal", "abandonment", "humiliation", "invisibility", "chaos", "rejection",
  "powerlessness", "shame", "grief", "exposure", "failure", "scarcity",
  "conflict", "disappointment", "loneliness", "misrecognition",
];

const GIFTS = [
  "pattern-reading", "truth-telling", "protective devotion", "quiet leadership",
  "inventive craft", "relational repair", "calm focus", "ethical backbone",
  "imaginative synthesis", "strategic patience", "beautiful restraint",
  "courageous honesty", "resource stewardship", "deep listening",
  "system sense", "creative grit",
];

const FEARS = [
  "being trapped", "being exposed", "being irrelevant", "hurting others",
  "making the wrong call", "losing control", "being ordinary", "being owned",
  "being misunderstood", "being too late", "being abandoned", "being powerless",
  "being indebted", "being ridiculed", "being outmatched", "being forgotten",
];

const ACADEMIC_NOUNS = [
  "Thesis", "Treatise", "Codex", "Monograph", "Ledger", "Chronicle", "Doctrine",
  "Atlas", "Index", "Archive", "Protocol", "Covenant", "Syllabus", "Ritual",
  "Psalter", "Glossary",
];

const EPITHETS = [
  "of Quiet Steel", "of the Long View", "of Glass & Ink", "of the Green Lamp",
  "of Oath and Orchard", "of Measured Fire", "of Salt and Silk", "of Winter Paper",
  "of Red Thread", "of Dark Water", "of Ivory Hours", "of Blue Smoke",
  "of the Unbroken Line", "of the Hidden Stair", "of the Open Door", "of the Last Light",
];

function makeName(kind, i, constellationId) {
  const c = pick(CONSTELLATIONS, i - 1);
  const noun = pick(ACADEMIC_NOUNS, i * 3);
  const epi = pick(EPITHETS, i * 5 + (kind === "shd" ? 9 : 0));
  const role =
    kind === "arch" ? pick(ROLE_ARCH, i)
    : kind === "lum" ? pick(ROLE_LUM, i)
    : pick(ROLE_SHD, i);
  // Subtle constellation flavor to avoid sameness:
  const flavor = constellationId ? ` — ${c.name}` : "";
  return `${role}'s ${noun} ${epi}${flavor}`;
}

function mkDomains(kind, c) {
  // Short, real notes — consistent, not blank.
  const psych =
    kind === "luminary"
      ? `When integrated, this pattern stabilizes the nervous system through ${c.virtue}; stress shows up as over-functioning.`
      : kind === "shadow"
      ? `This pattern is a defense against ${c.core}; it tries to regain safety through ${c.vice} and avoidance.`
      : `This archetype organizes identity around ${c.core}; maturity expresses as ${c.virtue}, immaturity as ${c.vice}.`;

  const socio =
    kind === "shadow"
      ? `In groups it escalates status games: it tests loyalty, withholds trust, and misreads threat as proof.`
      : `In groups it becomes a stabilizer: it sets norms, protects boundaries, and turns conflict into structure.`;

  const pedagogy =
    kind === "shadow"
      ? `Learns best through contained experiments and accountability; resists vague feedback and collapses under shame.`
      : `Learns best through mentorship + practice loops; thrives with clear criteria and meaningful responsibility.`;

  const anth =
    `Across cultures, it resembles a role found in ${c.setting}; its taboo is the misuse of authority for ego-protection.`;

  return {
    psychology: { notes: psych, signals: [] },
    sociology: { notes: socio, signals: [] },
    pedagogy: { notes: pedagogy, signals: [] },
    anthropology: { notes: anth, signals: [] },
  };
}

function mkSignalsBase(kind, virtue, vice, wound, gift, fear) {
  if (kind === "luminary") {
    return {
      gifts: [
        `Turns ${wound} into wisdom without spectacle.`,
        `Leads with ${virtue} and keeps others safe to grow.`,
        `Uses ${gift} to clarify what matters.`,
      ],
      strengths: [
        `High standards without cruelty.`,
        `Boundary-setting that protects connection.`,
        `Crisis competence (calm under pressure).`,
      ],
      risks: [
        `Over-responsibility: carrying what isn’t theirs.`,
        `Becoming the “fixer” and losing play.`,
      ],
      triggers: [
        `Ambiguity that feels like danger.`,
        `Public shaming / being misread.`,
      ],
      growth: [
        `Ask for consent before helping.`,
        `Name needs plainly; reduce mind-reading.`,
        `Practice rest as discipline.`,
      ],
      relationships: [
        `Most compatible with people who respect pace and truth.`,
        `Struggles with chronic chaos unless boundaries are honored.`,
      ],
    };
  }

  if (kind === "shadow") {
    return {
      gifts: [
        `A sharp alarm system: detects inconsistency early.`,
        `Protects the wound of ${wound} by refusing false safety.`,
      ],
      strengths: [
        `Can be brutally honest when channeled well.`,
        `Sees weak points in plans and people.`,
      ],
      risks: [
        `Uses ${vice} to manage fear of ${fear}.`,
        `Punishes closeness pre-emptively.`,
        `Confuses control with safety.`,
      ],
      triggers: [
        `Feeling unseen, compared, or cornered.`,
        `Rules that change without explanation.`,
      ],
      growth: [
        `Replace accusation with curiosity.`,
        `Practice repair after rupture.`,
        `Move from “prove it” to “build it.”`,
      ],
      relationships: [
        `Tests loyalty; needs consistent reassurance + boundaries.`,
        `Often bonds through intensity rather than trust.`,
      ],
    };
  }

  // archetype
  return {
    gifts: [
      `Builds identity around ${virtue} and ${gift}.`,
      `Creates durable meaning out of ${wound}.`,
    ],
    strengths: [
      `Strategic patience and pattern sense.`,
      `High discernment: can name what’s true.`,
    ],
    risks: [
      `Under stress it slips into ${vice} to avoid ${fear}.`,
      `Becomes performative instead of present.`,
    ],
    triggers: [
      `Unclear expectations; moving goalposts.`,
      `Feeling replaceable or misrecognized.`,
    ],
    growth: [
      `Choose one courageous truth per day.`,
      `Trade perfection for honest iteration.`,
      `Let support be received, not earned.`,
    ],
    relationships: [
      `Seeks respect before intimacy; needs both.`,
      `Best with those who value consent, clarity, and steady repair.`,
    ],
  };
}

function loreAD(kind, name, c, virtue, vice, wound, gift, fear, role) {
  // A–D: readable, “real” prose, consistent tone.
  const A = {
    label: "A",
    summary: `Core pattern: ${c.core} expressed through ${virtue}.`,
    long:
      `There is a particular way ${name} enters a room: not loudly, but with consequence. ` +
      `Their identity organizes around ${c.core}—the need to make the world legible and livable. ` +
      `At their best, they embody ${virtue}: the kind that steadies others without demanding credit. ` +
      `Their gift is ${gift}, and it’s rarely accidental; it is practiced.`,
    cues: [
      `Primary virtue: ${virtue}`,
      `Primary gift: ${gift}`,
      `Constellation: ${c.name}`,
    ],
    tone: kind === "shadow" ? "wound/defense" : "refined/constructive",
  };

  const B = {
    label: "B",
    summary: `How it presents socially: the ${role} archetype in motion.`,
    long:
      `Socially, this pattern becomes a role: the ${role}. In ${c.setting}, they tend to be the one who notices what others skip—` +
      `the missing assumption, the quiet tension, the unspoken cost. ` +
      `When aligned, they communicate with clarity and restraint. When misaligned, they overcorrect—` +
      `turning ${virtue} into a performance and calling it “standards.”`,
    cues: [
      `Role: ${role}`,
      `Social signature: measured clarity`,
      `Shadow tell: overcorrecting`,
    ],
    tone: "social",
  };

  const C = {
    label: "C",
    summary: `Pressure point: fear of ${fear} and the wound of ${wound}.`,
    long:
      `Under pressure, the system reveals why it formed: to survive ${wound}. ` +
      `The deepest fear is ${fear}, and the nervous system tries to prevent it by reaching for ${vice}. ` +
      `This is where the story becomes brittle: control replaces connection; certainty replaces curiosity; protection becomes punishment. ` +
      `In this phase, the pattern can harm what it claims to defend.`,
    cues: [
      `Wound: ${wound}`,
      `Fear: ${fear}`,
      `Stress move: ${vice}`,
    ],
    tone: kind === "luminary" ? "pressure-test" : "fracture",
  };

  const D = {
    label: "D",
    summary: `Integration: turning the defense into craft.`,
    long:
      `Integration doesn’t erase the wound—it gives it a rightful place. ` +
      `${name} becomes real when ${virtue} is chosen without contempt and boundaries are set without theatrics. ` +
      `The gift of ${gift} turns into a practice: naming truth, building trust, and allowing repair after rupture. ` +
      `Mastery looks like this: steady action, clean language, and a life that matches its own ethics.`,
    cues: [
      `Integration = boundaries + repair`,
      `Mastery = ethics in action`,
      `Legacy = steadiness`,
    ],
    tone: "integration",
  };

  return { A, B, C, D };
}

// ---------- Builders ----------
function buildLuminaries(count = 800) {
  const list = [];
  for (let i = 1; i <= count; i++) {
    const id = `lum_${pad(i, 4)}`;
    const tag = `LUM_${pad(i, 4)}`;

    const c = pick(CONSTELLATIONS, i - 1);
    const virtue = pick(VIRTUES, i * 2);
    const vice = c.vice;
    const wound = pick(WOUNDS, i * 3);
    const gift = pick(GIFTS, i * 5);
    const fear = pick(FEARS, i * 7);
    const role = pick(ROLE_LUM, i);

    const name = makeName("lum", i, c.id);

    list.push({
      id,
      kind: "luminary",
      tag,
      name,
      aliases: [],
      constellation: c.id,
      domains: mkDomains("luminary", c),
      signals: mkSignalsBase("luminary", virtue, vice, wound, gift, fear),
      lore: loreAD("luminary", name, c, virtue, vice, wound, gift, fear, role),
      ui: { icon: "star", colorHint: "light" },
      meta: { version: 2, createdBy: "canon-realizer" },
    });
  }
  return list;
}

function buildShadows(count = 800) {
  const list = [];
  for (let i = 1; i <= count; i++) {
    const id = `shd_${pad(i, 4)}`;
    const tag = `SHD_${pad(i, 4)}`;

    const c = pick(CONSTELLATIONS, (i - 1) + 8); // offset so shadows skew different
    const virtue = c.virtue;
    const vice = pick(["control", "avoidance", "contempt", "withholding", "projection", "compulsion"], i);
    const wound = pick(WOUNDS, i * 4 + 3);
    const gift = pick(GIFTS, i * 6 + 1);
    const fear = pick(FEARS, i * 8 + 2);
    const role = pick(ROLE_SHD, i);

    const name = makeName("shd", i, c.id);

    list.push({
      id,
      kind: "shadow",
      tag,
      name,
      aliases: [],
      constellation: c.id,
      domains: mkDomains("shadow", c),
      signals: mkSignalsBase("shadow", virtue, vice, wound, gift, fear),
      lore: loreAD("shadow", name, c, virtue, vice, wound, gift, fear, role),
      ui: { icon: "moon", colorHint: "dark" },
      meta: { version: 2, createdBy: "canon-realizer" },
    });
  }
  return list;
}

function buildArchetypes(count = 900, lumCount = 800, shdCount = 800) {
  const list = [];
  for (let i = 1; i <= count; i++) {
    const id = `arch_${pad(i, 3)}`;
    const tag = `ARCH_${pad(i, 3)}`;

    const c = pick(CONSTELLATIONS, i - 1);
    const virtue = c.virtue;
    const vice = c.vice;
    const wound = pick(WOUNDS, i * 3 + 11);
    const gift = pick(GIFTS, i * 2 + 7);
    const fear = pick(FEARS, i * 5 + 13);
    const role = pick(ROLE_ARCH, i);

    const name = makeName("arch", i, c.id);

    // Cross-links (stable + evenly distributed)
    const lumA = ((i * 7) % lumCount) + 1;
    const lumB = ((i * 13) % lumCount) + 1;
    const shdA = ((i * 9) % shdCount) + 1;
    const shdB = ((i * 17) % shdCount) + 1;

    list.push({
      id,
      kind: "archetype",
      tag,
      name,
      subtitle: `A ${c.core} archetype: ${virtue} under oath, ${vice} under strain.`,
      constellation: c.id,
      luminaryTags: [`LUM_${pad(lumA, 4)}`, `LUM_${pad(lumB, 4)}`],
      shadowTags: [`SHD_${pad(shdA, 4)}`, `SHD_${pad(shdB, 4)}`],
      domains: mkDomains("archetype", c),
      signals: mkSignalsBase("archetype", virtue, vice, wound, gift, fear),
      lore: loreAD("archetype", name, c, virtue, vice, wound, gift, fear, role),
      ui: { icon: "sigil", colorHint: "neutral" },
      meta: { version: 2, createdBy: "canon-realizer" },
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
      x.tag,
      x.constellation,
      ...(x.aliases || []),
      ...(x.subtitle ? [x.subtitle] : []),
    ].filter(Boolean))),
  });
  return [...archetypes.map(toIndex), ...luminaries.map(toIndex), ...shadows.map(toIndex)];
}

function writeJson(filename, data) {
  const outPath = path.join(OUT_DIR, filename);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf8");
  console.log(`✅ Wrote ${filename} (${Array.isArray(data) ? data.length : "object"})`);
}

function main() {
  ensureDir(OUT_DIR);

  const luminaries = buildLuminaries(800);
  const shadows = buildShadows(800);
  const archetypes = buildArchetypes(900, 800, 800);
  const loreIndex = buildLoreIndex(archetypes, luminaries, shadows);

  writeJson("all1600_luminaries.json", luminaries);
  writeJson("all1600_shadows.json", shadows);
  writeJson("all900archetypes.json", archetypes);
  writeJson("lore.index.json", loreIndex);

  console.log("🎯 Real canon generated: A–D lore + domains + signals are populated.");
}

main();
