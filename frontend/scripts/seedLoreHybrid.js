// backend/scripts/seedLoreHybrid.js
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import LoreEntry from "../models/LoreEntry.js";

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function uniq(arr) { return Array.from(new Set(arr)); }
function pickMany(rng, arr, n) {
  const out = [];
  const used = new Set();
  while (out.length < n && used.size < arr.length) {
    const v = pick(rng, arr);
    if (!used.has(v)) { used.add(v); out.push(v); }
  }
  return out;
}
function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .trim();
}

function mkHybridName(rng, kind) {
  const academy = ["Scholar","Archivist","Curator","Provost","Librarian","Scribe","Cartographer","Lecturer","Alchemist","Chronicler","Rector","Custodian","Examiner","Artificer"];
  const myth = ["Oracle","Warden","Herald","Seer","Oathkeeper","Sentinel","Weaver","Starforged","Moonbound","Ashborn","Verdant","Crowned"];
  const lumAdj = ["Evergreen","Gilded","Silvered","Radiant","Lanterned","Hallowed","Cerulean","Ivory","Aurelian","Rosewood","Brassbound"];
  const shaAdj = ["Inkbound","Wormwood","Hollow","Ashen","Rusted","Blackglass","Veiled","Splintered","Thorned","Cinderwrought","Saltwound"];
  const relics = ["Codex","Lamp","Key","Seal","Mirror","Compass","Crown","Quill","Bell","Mask","Lattice","Sigil","Oath","Chalice"];
  const places = ["of the Atrium","of the Underlibrary","of the Observatory","of the Iron Cloister","of the Archive","of the Ember Wing","of the Moon Corridor","of the Oxblood Study"];

  const A = kind === "luminary" ? lumAdj : shaAdj;
  const title = pick(rng, rng() < 0.6 ? academy : myth);
  const name = `The ${pick(rng, A)} ${title} ${pick(rng, rng() < 0.5 ? [`of the ${pick(rng, relics)}`] : places)}`;
  return name.replace(/\s+/g, " ").trim();
}

function mkLoreParagraphs(rng, kind, name) {
  const lum1 = [
    `${name} moves through the archive like lamplight—steady, disciplined, unwilling to lie for speed.`,
    `${name} is brilliance without noise: a quiet authority that makes work feel sacred again.`,
    `${name} keeps the vow of craft: return, refine, and let truth take time.`
  ];
  const lum2 = [
    "Their gift is cultivation—turning inspiration into repeatable beauty. Mastery becomes a sanctuary, not a performance.",
    "They teach you to choose the next true step. Structure holds the soul instead of replacing it.",
    "In their presence, patience stops being delay and becomes precision."
  ];
  const sha1 = [
    `${name} learned survival through flawlessness. It calls survival “standards” and asks you to worship them.`,
    `${name} is the velvet critic behind your shoulder: it edits courage before it can move.`,
    `${name} keeps a ledger of possible mistakes and names the ledger “wisdom.”`
  ];
  const sha2 = [
    "When triggered, it narrows your world until only control feels real. You over-prepare, over-polish, or vanish.",
    "It promises safety but charges interest: time, joy, and momentum. The payments never end.",
    "It protects you from failure by protecting you from beginnings."
  ];
  const p1 = pick(rng, kind === "luminary" ? lum1 : sha1);
  const p2 = pick(rng, kind === "luminary" ? lum2 : sha2);
  return [p1, p2];
}

function mkCore(kind, rng) {
  if (kind === "luminary") {
    return {
      essence: pick(rng, [
        "Refined intellect braided with devotion.",
        "Beauty built from repetition and truth.",
        "Calm mastery: slow, precise, sovereign.",
        "Disciplined wonder, turned into craft."
      ]),
      mantra: pick(rng, [
        "I refine until it holds.",
        "I choose the next true step.",
        "My craft is my covenant.",
        "I honor the slow forge."
      ])
    };
  }
  return {
    essence: pick(rng, [
      "Perfection used as shelter from risk.",
      "Shame disguised as standards.",
      "Fear that tightens the hand before the first stroke.",
      "A hunger for control that blurs meaning."
    ]),
    mantra: pick(rng, [
      "If it isn’t perfect, it isn’t safe.",
      "I can’t begin unless I’m ready.",
      "If I stop, I’ll be seen.",
      "I must earn rest."
    ])
  };
}

function mkLists(rng, kind) {
  const giftsLum = ["Deep focus under pressure","Elegant structure","Patience that produces mastery","Taste for truth","Sovereign boundaries","Calm authority","Refine without erasing soul","Consistency that compounds"];
  const risksLum = ["Over-refinement delays release","Distance disguised as discipline","Rigid systems","Judging others’ pace"];
  const giftsSha = ["Signal: you care deeply","Detail sensitivity","Pattern detection","High standards (when softened)","Warning system for real risks","Consequences awareness"];
  const risksSha = ["Paralysis","Endless revisions","Self-criticism","Control spirals","Comparison obsession","Burnout masked as ambition"];
  const triggersSha = ["Public judgment","Deadlines","Being watched","Unclear instructions","Feeling behind","Publishing","Authority figures","Money pressure"];

  if (kind === "luminary") {
    return { gifts: pickMany(rng, giftsLum, 5), risks: pickMany(rng, risksLum, 4), triggers: [] };
  }
  return { gifts: pickMany(rng, giftsSha, 5), risks: pickMany(rng, risksSha, 5), triggers: pickMany(rng, triggersSha, 4) };
}

function mkDeepLayers(rng, kind) {
  if (kind === "luminary") {
    return {
      psychology: {
        coreDrive: pick(rng, ["Mastery through repetition","Truth-alignment","Quiet excellence","Meaningful structure"]),
        coreFear: pick(rng, ["Distortion through haste","Superficiality","Loss of integrity","Chaos without craft"]),
        protectiveFunction: pick(rng, ["Slows cognition to prevent distortion","Builds systems to hold meaning","Turns impulse into ritual"]),
        attachmentPattern: pick(rng, ["Secure–avoidant","Secure","Earned secure"]),
        nervousSystemBias: pick(rng, ["Parasympathetic dominant","Regulated focus","Calm vigilance"]),
      },
      sociology: {
        roles: pickMany(rng, ["Archivist","Mentor","Researcher","Craftsperson","Editor","Curator","Teacher","Strategist"], 4),
        modernManifestations: pickMany(rng, ["Long-form creator","Academic","Studio artist","Engineer","Librarian","Historian","Designer"], 4),
        socialReward: pick(rng, ["Trust and authority","Respect for competence","Reliability in crisis","Quiet leadership"]),
        socialCost: pick(rng, ["Seen as slow","Seen as distant","Under-credited work","Pressure to always be ‘right’"]),
      },
      anthropology: {
        historicalEchoes: pickMany(rng, ["Monastic scribes","Guild masters","Court historians","Scholar-officials","Temple record-keepers"], 2),
        mythicParallels: pickMany(rng, ["Athena","Thoth","Brigid","Hermes (as scribe)","Odin (as seeker)"], 2),
        culturalVariants: pickMany(rng, ["The Sage","The Keeper","The Archivist","The Lampbearer","The Steward"], 3),
      },
      pedagogy: {
        teaches: pick(rng, ["Mastery is built, not discovered.","Discipline protects inspiration.","Structure can be kindness.","Depth beats speed."]),
        learnsBestThrough: pickMany(rng, ["Repetition","Apprenticeship","Silent study","Long projects","Feedback loops","Ritual"], 4),
        integrationPractices: pickMany(rng, ["Daily craft ritual","Slow reading","One-page refinement","Weekly review","Constraint practice"], 4),
      },
      development: {
        earlyExpression: pick(rng, ["Rigid discipline","Over-control","Over-structure"]),
        matureExpression: pick(rng, ["Selective rigor","Flexible structure","Calm standards"]),
        integratedExpression: pick(rng, ["Confident release","Truth with softness","Mastery without fear"]),
      },
    };
  }

  // shadow
  return {
    psychology: {
      coreDrive: pick(rng, ["Avoid shame through control","Prevent exposure","Stay safe by perfecting","Earn belonging via performance"]),
      coreFear: pick(rng, ["Being seen as inadequate","Public failure","Rejection","Loss of control"]),
      protectiveFunction: pick(rng, ["Delays action to avoid judgment","Narrows choices to reduce risk","Weaponizes standards as armor"]),
      attachmentPattern: pick(rng, ["Anxious–avoidant","Anxious","Dismissive–avoidant"]),
      nervousSystemBias: pick(rng, ["Sympathetic freeze","Hypervigilance","Fight/flight oscillation"]),
    },
    sociology: {
      roles: pickMany(rng, ["Perfectionist employee","Invisible expert","Over-preparer","Gatekeeper","Over-achiever"], 3),
      modernManifestations: pickMany(rng, ["Draft-hoarding creator","Burned-out student","Overworking professional","Comparison scroller"], 3),
      socialReward: pick(rng, ["Praise for quality","Approval from authority","Temporary safety"]),
      socialCost: pick(rng, ["Stagnation","Isolation","Missed opportunities","Chronic stress"]),
    },
    anthropology: {
      historicalEchoes: pickMany(rng, ["Punished scribes","Status-bound apprentices","Shame-based schooling","Courtly perfection codes"], 2),
      mythicParallels: pickMany(rng, ["The Furies (inner judgment)","Cronus (control)","Medusa (shame)","Hades (withdrawal)"], 2),
      culturalVariants: pickMany(rng, ["The Judge","The Inner Critic","The Gatekeeper","The Masked One"], 3),
    },
    pedagogy: {
      teaches: pick(rng, ["Fear often masquerades as standards.","Control is not safety.","Beginnings are medicine.","Play restores motion."]),
      learnsBestThrough: pickMany(rng, ["Low-stakes exposure","Play","Timed drafts","Witnessed imperfection","Compassionate review"], 4),
      integrationPractices: pickMany(rng, ["10-minute ugly draft","Publish a ‘version 1’","Body-based reset","Name the fear","One imperfect share"], 4),
    },
    development: {
      earlyExpression: pick(rng, ["Avoidance","Over-polishing","Procrastination as protection"]),
      matureExpression: pick(rng, ["Self-aware standards","Risk tolerance grows","Boundaries with the inner critic"]),
      integratedExpression: pick(rng, ["Courageous output","Standards softened by compassion","Consistency without shame"]),
    },
  };
}

function buildEntries(countEach = 800, seed = 424242) {
  const rng = mulberry32(seed);

  const lum = [];
  const sha = [];

  for (let i = 1; i <= countEach; i++) {
    const name = mkHybridName(rng, "luminary");
    const id = `lumi_${slugify(name)}_${i}`;
    const core = mkCore("luminary", rng);
    const lore = mkLoreParagraphs(rng, "luminary", name);
    const lists = mkLists(rng, "luminary");
    const deep = mkDeepLayers(rng, "luminary");

    lum.push({
      id, kind: "luminary", name,
      essence: core.essence, mantra: core.mantra,
      shortLore: lore[0], lore,
      gifts: lists.gifts, risks: lists.risks, triggers: [],
      ...deep,
      counterweights: { bestLuminaries: [], bestShadowsToWatch: [], stabilizingLuminaries: [], shadowToWatch: "" },
    });
  }

  for (let i = 1; i <= countEach; i++) {
    const name = mkHybridName(rng, "shadow");
    const id = `shadow_${slugify(name)}_${i}`;
    const core = mkCore("shadow", rng);
    const lore = mkLoreParagraphs(rng, "shadow", name);
    const lists = mkLists(rng, "shadow");
    const deep = mkDeepLayers(rng, "shadow");

    sha.push({
      id, kind: "shadow", name,
      essence: core.essence, mantra: core.mantra,
      shortLore: lore[0], lore,
      gifts: lists.gifts, risks: lists.risks, triggers: lists.triggers,
      ...deep,
      counterweights: { bestLuminaries: [], bestShadowsToWatch: [], stabilizingLuminaries: [], shadowToWatch: "" },
    });
  }

  // wire counterweights
  const lumIds = lum.map((x) => x.id);
  const shaIds = sha.map((x) => x.id);
  const rng2 = mulberry32(seed + 1337);

  for (const L of lum) {
    L.counterweights.bestLuminaries = uniq(pickMany(rng2, lumIds, 2).filter((x) => x !== L.id));
    L.counterweights.bestShadowsToWatch = uniq(pickMany(rng2, shaIds, 2));
  }
  for (const S of sha) {
    S.counterweights.stabilizingLuminaries = uniq(pickMany(rng2, lumIds, 2));
    S.counterweights.shadowToWatch = pick(rng2, shaIds);
  }

  return [...lum, ...sha];
}

async function main() {
  if (!MONGO_URI) throw new Error("Missing MONGO_URI (or MONGODB_URI) in backend/.env");
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });

  const entries = buildEntries(800, 424242);
  const ops = entries.map((doc) => ({
    updateOne: { filter: { id: doc.id }, update: { $set: doc }, upsert: true },
  }));

  const CHUNK = 500;
  for (let i = 0; i < ops.length; i += CHUNK) {
    await LoreEntry.bulkWrite(ops.slice(i, i + CHUNK), { ordered: false });
    console.log(`Seeded ${Math.min(i + CHUNK, ops.length)}/${ops.length}`);
  }

  console.log("Counts:",
    await LoreEntry.countDocuments({ kind: "luminary" }),
    await LoreEntry.countDocuments({ kind: "shadow" })
  );

  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
