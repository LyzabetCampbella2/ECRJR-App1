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
  return String(s).toLowerCase().replace(/[^a-z0-9\s_-]/g, "").replace(/\s+/g, "_").replace(/_+/g, "_").trim();
}

function mkArchetypeName(rng) {
  const cores = ["Sage","Seeker","Artificer","Oracle","Warden","Weaver","Pilgrim","Curator","Scholar","Sentinel","Alchemist","Herald","Cartographer","Archivist"];
  const tones = ["Gilded","Ashen","Verdant","Ivory","Oxblood","Cerulean","Brassbound","Moonbound","Starforged","Lanterned","Veiled","Hallowed"];
  const domains = ["of the Archive","of the Threshold","of the Underlibrary","of the Observatory","of the Iron Cloister","of the River Court","of the Ember Wing","of the Quiet Hall"];
  return `The ${pick(rng, tones)} ${pick(rng, cores)} ${pick(rng, domains)}`.replace(/\s+/g, " ").trim();
}

function mkDeep(rng) {
  return {
    psychology: {
      coreDrive: pick(rng, ["Meaning-making","Mastery","Belonging","Agency","Truth","Impact","Safety"]),
      coreFear: pick(rng, ["Insignificance","Rejection","Chaos","Exposure","Stagnation","Loss of control"]),
      protectiveFunction: pick(rng, ["Creates structure","Seeks certainty","Avoids risk","Overfunctions","Withdraws","Performs"]),
      attachmentPattern: pick(rng, ["Secure","Anxious","Avoidant","Anxious–avoidant","Earned secure"]),
      nervousSystemBias: pick(rng, ["Regulated focus","Sympathetic activation","Freeze/avoidance","Fight/flight oscillation"]),
    },
    sociology: {
      roles: pickMany(rng, ["Leader","Mentor","Outsider","Caretaker","Strategist","Critic","Creator","Guardian","Mediator"], 4),
      modernManifestations: pickMany(rng, ["Founder","Researcher","Artist","Teacher","Operator","Designer","Writer","Therapist","Community builder"], 4),
      socialReward: pick(rng, ["Trust","Status","Belonging","Influence","Safety","Admiration"]),
      socialCost: pick(rng, ["Isolation","Burnout","Misunderstanding","Over-responsibility","Invisibility"]),
    },
    anthropology: {
      historicalEchoes: pickMany(rng, ["Monastic traditions","Guild systems","Initiation rites","Courtly codes","Oral storytelling lineages"], 2),
      mythicParallels: pickMany(rng, ["Athena","Hermes","Thoth","Brigid","Odin","Hecate","Apollo"], 2),
      culturalVariants: pickMany(rng, ["The Sage","The Hero","The Trickster","The Caretaker","The Guardian","The Mystic"], 3),
    },
    pedagogy: {
      teaches: pick(rng, ["Your pattern is trying to protect you.","Skill grows through repetition.","Courage is a practice.","Structure can be kindness."]),
      learnsBestThrough: pickMany(rng, ["Apprenticeship","Experimentation","Reflection","Community feedback","Constraints","Play"], 4),
      integrationPractices: pickMany(rng, ["Daily ritual","Weekly review","One uncomfortable action","Timed draft","Mentor check-in","Somatic reset"], 4),
    },
    development: {
      earlyExpression: pick(rng, ["Over-identification with the role","Rigidity","Avoidance","People-pleasing"]),
      matureExpression: pick(rng, ["Self-awareness","Selective boundaries","Flexible competence"]),
      integratedExpression: pick(rng, ["Service without self-erasure","Confidence without armor","Action without shame"]),
    },
  };
}

async function main() {
  if (!MONGO_URI) throw new Error("Missing MONGO_URI (or MONGODB_URI) in backend/.env");
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });

  const rng = mulberry32(777777);
  const entries = [];

  for (let i = 1; i <= 900; i++) {
    const name = mkArchetypeName(rng);
    const id = `arch_${slugify(name)}_${i}`;

    const lore = [
      `${name} is the pattern beneath the pattern—part myth, part method. It describes what you do when stakes rise.`,
      `When integrated, it becomes a style of courage. When distorted, it becomes a costume you can’t take off.`
    ];

    const deep = mkDeep(rng);

    entries.push({
      id,
      kind: "archetype",
      name,
      essence: pick(rng, ["A living motif of action and meaning.","A role the psyche rehearses under pressure.","A mythic method for surviving and thriving."]),
      mantra: pick(rng, ["I choose the truest next step.","I can evolve without abandoning myself.","I practice courage, not perfection."]),
      shortLore: lore[0],
      lore,
      gifts: pickMany(rng, ["Clarity under pressure","Pattern recognition","Leadership","Creative force","Empathy","Strategic patience","Moral courage"], 5),
      risks: pickMany(rng, ["Rigidity","Control spirals","Avoidance","Over-responsibility","Identity fusion","Burnout"], 5),
      triggers: pickMany(rng, ["Ambiguity","Criticism","Deadlines","High visibility","Conflict","Loss"], 3),
      ...deep,
      counterweights: {
        bestLuminaries: [],
        bestShadowsToWatch: [],
        stabilizingLuminaries: [],
        shadowToWatch: "",
      },
    });
  }

  const ops = entries.map((doc) => ({
    updateOne: { filter: { id: doc.id }, update: { $set: doc }, upsert: true },
  }));

  const CHUNK = 500;
  for (let i = 0; i < ops.length; i += CHUNK) {
    await LoreEntry.bulkWrite(ops.slice(i, i + CHUNK), { ordered: false });
    console.log(`Seeded ${Math.min(i + CHUNK, ops.length)}/${ops.length}`);
  }

  console.log("Archetypes:", await LoreEntry.countDocuments({ kind: "archetype" }));
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
