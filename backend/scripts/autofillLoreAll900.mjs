// backend/scripts/autofillLoreAll900.mjs
import dotenv from "dotenv";
import mongoose from "mongoose";
import LoreEntry from "../models/LoreEntry.js";

dotenv.config();

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI missing in .env");
  process.exit(1);
}

const CONSTELLATIONS = [
  { key: "The Lantern", theme: "Guidance, meaning, orientation in the dark" },
  { key: "The Crown", theme: "Authority, stewardship, ethical power" },
  { key: "The Quill", theme: "Language, truth, record-keeping, vows" },
  { key: "The Hearth", theme: "Belonging, care, kinship, restoration" },
  { key: "The Tide", theme: "Emotion, cycles, grief, renewal" },
  { key: "The Forge", theme: "Discipline, craft, transformation, cost" },
  { key: "The Gate", theme: "Thresholds, initiation, choice, consequence" },
  { key: "The Mirror", theme: "Identity, reflection, shadow-work" },
  { key: "The Compass", theme: "Path, purpose, integrity under motion" },
  { key: "The Garden", theme: "Growth, patience, cultivation, seasons" },
  { key: "The Tower", theme: "Vision, systems, strategy, long memory" },
  { key: "The Veil", theme: "Mystery, intuition, hidden patterns" },
];

const ROLE_FLAVOR = {
  Scribe: {
    gift: "precision with truth and memory",
    cost: "the loneliness of seeing clearly",
    vow: "to record what is real without cruelty",
  },
  Wayfarer: {
    gift: "movement that reveals meaning",
    cost: "restlessness when stillness is required",
    vow: "to keep traveling without abandoning what matters",
  },
  Keeper: {
    gift: "stewardship of people, places, or promises",
    cost: "over-control when fear is loud",
    vow: "to protect without possession",
  },
  Architect: {
    gift: "systems that hold under pressure",
    cost: "treating life like a blueprint instead of a pulse",
    vow: "to design for humans, not just outcomes",
  },
  Witness: {
    gift: "clarity without domination",
    cost: "absorbing what others refuse to see",
    vow: "to name truth and still keep the heart open",
  },
  Harbor: {
    gift: "making refuge where there was none",
    cost: "carrying others until the body protests",
    vow: "to shelter without self-erasure",
  },
  Vanguard: {
    gift: "first steps into risk on behalf of the many",
    cost: "becoming addicted to urgency",
    vow: "to lead with restraint, not spectacle",
  },
  Seeker: {
    gift: "questions that open locked doors",
    cost: "never feeling finished",
    vow: "to pursue without dissolving into doubt",
  },
  Oracle: {
    gift: "pattern-sight and quiet inference",
    cost: "speaking too soon or too late",
    vow: "to offer insight with humility",
  },
  Weaver: {
    gift: "connection—threads into fabric",
    cost: "entanglement when boundaries blur",
    vow: "to bind what is worthy and release the rest",
  },
  Cartographer: {
    gift: "mapping the unseen terrain",
    cost: "confusing the map with the land",
    vow: "to revise beliefs when reality changes",
  },
  Gardener: {
    gift: "patient cultivation of growth",
    cost: "grief when seasons demand endings",
    vow: "to tend what is alive without forcing bloom",
  },
  Scholar: {
    gift: "learning that becomes wisdom",
    cost: "hiding behind knowledge to avoid choice",
    vow: "to study for service, not superiority",
  },
  Warden: {
    gift: "boundaries that keep the world safe",
    cost: "rigidity when compassion is required",
    vow: "to guard without becoming the cage",
  },
  Diplomat: {
    gift: "translation between realities",
    cost: "appeasement when firmness is needed",
    vow: "to bridge without bargaining away the soul",
  },
  Herald: {
    gift: "messages that move people toward meaning",
    cost: "becoming addicted to reaction",
    vow: "to speak for truth, not attention",
  },
  Artisan: {
    gift: "craft that dignifies the ordinary",
    cost: "perfectionism that stalls completion",
    vow: "to create honestly, not endlessly",
  },
  Sentinel: {
    gift: "watchfulness that prevents harm",
    cost: "hypervigilance that never sleeps",
    vow: "to protect without living in fear",
  },
  Anchor: {
    gift: "stability others can lean on",
    cost: "refusing necessary change",
    vow: "to stay steady while still growing",
  },
  Librarian: {
    gift: "curation of meaning across time",
    cost: "hoarding insight instead of sharing it",
    vow: "to keep the archive alive and accessible",
  },
  Chronicler: {
    gift: "narrative that makes sense of chaos",
    cost: "turning life into a story to avoid feeling it",
    vow: "to tell the truth without turning pain into theater",
  },
  Alchemist: {
    gift: "transformation—turning pressure into value",
    cost: "risking too much for the promise of change",
    vow: "to transmute without self-destruction",
  },
  Navigator: {
    gift: "direction when others drift",
    cost: "control when surrender is needed",
    vow: "to guide without forcing",
  },
  Mediator: {
    gift: "repair after rupture",
    cost: "taking responsibility for everyone’s emotions",
    vow: "to restore without self-sacrifice",
  },
  Monk: {
    gift: "discipline that calms the mind",
    cost: "withdrawal disguised as purity",
    vow: "to practice presence, not avoidance",
  },
  Knight: {
    gift: "courage in defense of values",
    cost: "confusing conflict with purpose",
    vow: "to serve honor—not ego",
  },
  Host: {
    gift: "welcoming that turns strangers into kin",
    cost: "performing warmth while feeling empty",
    vow: "to offer belonging with boundaries",
  },
  Bard: {
    gift: "meaning through story and song",
    cost: "becoming dependent on audience hunger",
    vow: "to create as medicine, not identity",
  },
  Apothecary: {
    gift: "care through careful remedies",
    cost: "fixing others to avoid one’s own wounds",
    vow: "to heal without controlling outcomes",
  },
  Pilgrim: {
    gift: "purpose gained through trials",
    cost: "romanticizing hardship to feel worthy",
    vow: "to walk toward truth, not suffering",
  },
};

const SCI_SECTIONS = [
  ["psychology", "Psychology"],
  ["sociology", "Sociology"],
  ["anthropology", "Anthropology"],
  ["pedagogy", "Pedagogy"],
  ["neuroscience", "Neuroscience"],
  ["philosophy", "Philosophy"],
  ["communication", "Communication"],
  ["leadership", "Leadership"],
];

function parseArchNum(tag) {
  const m = String(tag || "").match(/^arch_(\d{3})$/i);
  return m ? Number(m[1]) : null;
}

function roleFromName(name) {
  const parts = String(name || "").trim().split(/\s+/);
  return parts.length ? parts[parts.length - 1] : "";
}

function isBlank(v) {
  return String(v || "").trim().length === 0;
}

function isEmptySection(sec) {
  if (!sec) return true;
  const summary = String(sec.summary || "").trim();
  const keys = ["concepts", "frameworks", "signals", "risks", "practices", "sources"];
  const anyList = keys.some((k) => Array.isArray(sec[k]) && sec[k].length > 0);
  return summary.length === 0 && !anyList;
}

function makeTagline(name) {
  return `Core archetype: ${String(name || "").replace(/^The\s+/i, "")}.`;
}

function makeOneLine(name, houseKey) {
  return `${name} is a living pattern of choice—what you protect, what you risk, and what you become within ${houseKey}.`;
}

function loreBody({ name, role, house }) {
  const f = ROLE_FLAVOR[role] || {
    gift: "a specific kind of strength",
    cost: "a specific kind of vulnerability",
    vow: "to live with integrity under pressure",
  };

  // 3 paragraphs: mythic + tension + vow
  return [
    `${name} belongs to ${house.key}: ${house.theme}. Their gift is ${f.gift}. Their cost is ${f.cost}.`,
    `They are not defined by comfort—they are defined by what they do when the moment asks for a decision. In balance, they bring order without cruelty and care without possession. Out of balance, the same power becomes a trap: intensity turns rigid, devotion turns controlling, and purpose turns into an excuse.`,
    `Their vow is simple and difficult: ${f.vow}. When they remember that vow, this star becomes a lantern for others. When they forget it, the constellation still shows the path—but it feels colder, like guidance without warmth.`,
  ].join("\n\n");
}

function scienceScaffold({ name, role, house, label }) {
  // short, consistent summaries you can expand later
  const base = `${label} lens on ${name} (${role}) in ${house.key}.`;

  const summaries = {
    Psychology: `${base} Focus on self-regulation, identity patterns, and stress responses that shape this archetype’s choices.`,
    Sociology: `${base} Focus on roles, norms, legitimacy, and group dynamics—how this archetype gains or loses trust in communities.`,
    Anthropology: `${base} Focus on ritual, cultural memory, and symbolic function—how this pattern appears across societies and myths.`,
    Pedagogy: `${base} Focus on learning behaviors, feedback loops, and skill formation—how this archetype teaches, trains, or resists growth.`,
    Neuroscience: `${base} Focus on attention, threat perception, and reward loops—how the nervous system pushes the archetype toward clarity or compulsion.`,
    Philosophy: `${base} Focus on virtue, duty, and meaning—what this archetype believes is worth protecting, even at cost.`,
    Communication: `${base} Focus on language choices, repair, and framing—how this archetype speaks to de-escalate, persuade, or reveal truth.`,
    Leadership: `${base} Focus on stewardship, boundaries, and decision ethics—how this archetype leads without becoming the cage.`,
  };

  const summary = summaries[label] || base;

  return {
    summary,
    concepts: [],
    frameworks: [],
    signals: [],
    risks: [],
    practices: [],
    sources: [],
  };
}

async function main() {
  const DRY_RUN = process.argv.includes("--dry");
  const LIMIT_ARG = process.argv.find((a) => a.startsWith("--limit="));
  const LIMIT = LIMIT_ARG ? Number(LIMIT_ARG.split("=")[1]) : null;

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Mongo connected");

  const cursor = LoreEntry.find({ type: "archetype" }).cursor();

  let scanned = 0;
  let changed = 0;

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    scanned++;
    if (LIMIT && scanned > LIMIT) break;

    const n = parseArchNum(doc.tag);
    if (!n || n < 1 || n > 900) continue;

    const house = CONSTELLATIONS[(n - 1) % CONSTELLATIONS.length];
    const name = String(doc.name || doc.tag).trim();
    const role = roleFromName(name);

    let did = false;

    // Ensure constellation meta (safe)
    doc.science = doc.science || {};
    doc.science.meta = doc.science.meta || {};
    if (isBlank(doc.science.meta.constellationKey)) {
      doc.science.meta.constellationKey = house.key;
      doc.science.meta.constellationTheme = house.theme;
      did = true;
    }

    // Tier 1 fields (safe)
    if (isBlank(doc.tagline)) {
      doc.tagline = makeTagline(name);
      did = true;
    }
    if (isBlank(doc.oneLine)) {
      doc.oneLine = makeOneLine(name, house.key);
      did = true;
    }

    // Tier 2 lore (safe)
    if (isBlank(doc.lore)) {
      doc.lore = loreBody({ name, role, house });
      did = true;
    }

    // Tier 3 science (safe)
    for (const [key, label] of SCI_SECTIONS) {
      const sec = doc.science[key];
      if (isEmptySection(sec)) {
        doc.science[key] = scienceScaffold({ name, role, house, label });
        did = true;
      }
    }

    if (did) {
      doc.lastEditedBy = "autolore";
      changed++;

      if (!DRY_RUN) await doc.save();
    }

    if (scanned % 100 === 0) {
      console.log(`… scanned ${scanned} | changed ${changed}${DRY_RUN ? " (dry)" : ""}`);
    }
  }

  console.log(`✅ Done. scanned=${scanned} changed=${changed}${DRY_RUN ? " (dry run, nothing saved)" : ""}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("❌ autofill lore failed:", e);
  process.exit(1);
});
