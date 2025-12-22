// backend/scripts/autoNameLoreEntries.mjs
import dotenv from "dotenv";
import mongoose from "mongoose";
import LoreEntry from "../models/LoreEntry.js";

dotenv.config();

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI missing in .env");
  process.exit(1);
}

// 30 adjectives x 30 roles = 900 unique archetype names
const ARCH_ADJS = [
  "Ivory","Ember","Verdant","Silent","Gilded","Ashen","Lunar","Solar","Hearth","Woven",
  "Inkbound","Wild","Iron","Velvet","Sable","Aurelian","Stone","Storm","Dawn","Twilight",
  "Cobalt","Oxblood","Frost","Saffron","Willow","Cedar","Riven","Hollow","Radiant","Secret"
];

const ROLES = [
  "Scribe","Wayfarer","Keeper","Architect","Witness","Harbor","Vanguard","Seeker","Oracle","Weaver",
  "Cartographer","Gardener","Scholar","Warden","Diplomat","Herald","Artisan","Sentinel","Anchor","Librarian",
  "Chronicler","Alchemist","Navigator","Mediator","Monk","Knight","Host","Bard","Apothecary","Pilgrim"
];

// Luminary / Shadow adjective sets (30 each) aligned by index
const LUM_ADJS = [
  "Radiant","Dawnlit","Beacon","Harmonizing","Courageous","Clear","Golden","Merciful","Steadfast","Noble",
  "Luminous","True","Kindled","Serene","Guiding","Resilient","Bright","Patient","Unifying","Elevated",
  "Joyful","Graceful","Temperate","Faithful","Generous","Whole","Awakened","Sovereign","Blessed","Consecrated"
];

const SHA_ADJS = [
  "Lost","Ashen","Hollow","Shattered","Rigid","Veiled","Bitter","Blighted","Fractured","Hungry",
  "Drowned","Cold","Feral","Bruised","Splintered","Burnt","Pale","Withered","Clenched","Tarnished",
  "Spiteful","Mute","Grasping","Walled","Obsessive","Fading","Twisted","Broken","Shadowed","Unmoored"
];

// 12 Constellation Houses (anchors)
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

function parseNumFromTag(tag) {
  // supports arch_001, lum_001, sha_001, shadow_001, luminary_001, etc.
  const m = String(tag || "").match(/(\d{3})(?!.*\d)/);
  return m ? Number(m[1]) : null;
}

function archetypeNameFor(n) {
  const ai = (n - 1) % 30;
  const ri = Math.floor((n - 1) / 30) % 30;
  return `The ${ARCH_ADJS[ai]} ${ROLES[ri]}`;
}

function luminaryNameFor(n) {
  const ri = Math.floor((n - 1) / 30) % 30;
  const li = (n - 1) % 30;
  return `The ${LUM_ADJS[li]} ${ROLES[ri]}`;
}

function shadowNameFor(n) {
  const ri = Math.floor((n - 1) / 30) % 30;
  const si = (n - 1) % 30;
  return `The ${SHA_ADJS[si]} ${ROLES[ri]}`;
}

function oneLineFor(type, n, name) {
  const house = CONSTELLATIONS[(n - 1) % CONSTELLATIONS.length];
  if (type === "luminary") return `${name} embodies the highest expression of this star — restraint, clarity, and service within ${house.key}.`;
  if (type === "shadow") return `${name} is the distorted survival-shape of this star — coping that became a cage within ${house.key}.`;
  return `${name} is a living pattern of choice — what you protect, what you risk, and what you become within ${house.key}.`;
}

function taglineFor(type, n, name) {
  if (type === "luminary") return `Best-self of ${name.replace(/^The\s+/,"")}.`;
  if (type === "shadow") return `Wound-form of ${name.replace(/^The\s+/,"")}.`;
  return `Core archetype: ${name.replace(/^The\s+/,"")}.`;
}

function shouldSet(fieldVal) {
  const v = String(fieldVal || "").trim();
  return v.length === 0;
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Mongo connected");

  const q = { type: { $in: ["archetype", "luminary", "shadow"] } };
  const cursor = LoreEntry.find(q).cursor();

  let scanned = 0;
  let changedCount = 0;

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    scanned++;

    const n = parseNumFromTag(doc.tag);
    if (!n || n < 1 || n > 900) continue;

    let nextName = "";
    if (doc.type === "archetype") nextName = archetypeNameFor(n);
    if (doc.type === "luminary") nextName = luminaryNameFor(n);
    if (doc.type === "shadow") nextName = shadowNameFor(n);

    const house = CONSTELLATIONS[(n - 1) % CONSTELLATIONS.length];

    let changed = false;

    // ✅ name: only set if empty OR equals tag (never overwrite real edits)
    if (shouldSet(doc.name) || String(doc.name).trim() === String(doc.tag).trim()) {
      doc.name = nextName;
      changed = true;
    }

    // ✅ tagline: only set if empty
    if (shouldSet(doc.tagline)) {
      doc.tagline = taglineFor(doc.type, n, nextName);
      changed = true;
    }

    // ✅ oneLine: only set if empty
    if (shouldSet(doc.oneLine)) {
      doc.oneLine = oneLineFor(doc.type, n, nextName);
      changed = true;
    }

    // ✅ Constellation tagging (safe: stored under science.meta)
    doc.science = doc.science || {};
    doc.science.meta = doc.science.meta || {};
    if (shouldSet(doc.science.meta.constellationKey)) {
      doc.science.meta.constellationKey = house.key;
      doc.science.meta.constellationTheme = house.theme;
      changed = true;
    }

    if (changed) {
      doc.lastEditedBy = "autoName";
      await doc.save();
      changedCount++;
    }

    if (scanned % 200 === 0) console.log(`… scanned ${scanned} | changed ${changedCount}`);
  }

  console.log(`✅ Done. scanned=${scanned} changed=${changedCount}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("❌ autoName failed:", e);
  process.exit(1);
});
