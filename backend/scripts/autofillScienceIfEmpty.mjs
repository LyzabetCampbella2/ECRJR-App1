// backend/scripts/autofillScienceIfEmpty.mjs
import dotenv from "dotenv";
import mongoose from "mongoose";
import LoreEntry from "../models/LoreEntry.js";

dotenv.config();

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI missing in .env");
  process.exit(1);
}

const SECTIONS = [
  ["psychology", "Psychology"],
  ["sociology", "Sociology"],
  ["anthropology", "Anthropology"],
  ["pedagogy", "Pedagogy"],
  ["neuroscience", "Neuroscience"],
  ["philosophy", "Philosophy"],
  ["communication", "Communication"],
  ["leadership", "Leadership"],
];

function isEmptySection(sec) {
  if (!sec) return true;
  const summary = (sec.summary || "").trim();
  const arrays = ["concepts", "frameworks", "signals", "risks", "practices", "sources"];
  const anyListHasItems = arrays.some((k) => Array.isArray(sec[k]) && sec[k].length > 0);
  return summary.length === 0 && !anyListHasItems;
}

function scaffold(archetypeName, label) {
  return {
    summary: `${label} starter scaffold for ${archetypeName}.`,
    concepts: [],
    frameworks: [],
    signals: [],
    risks: [],
    practices: [],
    sources: [],
  };
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Mongo connected");

  const cursor = LoreEntry.find({ type: "archetype" }).cursor();

  let scanned = 0;
  let updated = 0;

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    scanned++;
    let changed = false;

    doc.science = doc.science || {};

    for (const [key, label] of SECTIONS) {
      const sec = doc.science[key];
      if (isEmptySection(sec)) {
        doc.science[key] = scaffold(doc.name || doc.tag, label);
        changed = true;
      }
    }

    if (changed) {
      doc.lastEditedBy = "autofill";
      await doc.save();
      updated++;
    }

    if (scanned % 100 === 0) console.log(`… scanned ${scanned}, updated ${updated}`);
  }

  console.log(`✅ Done. scanned=${scanned} updated=${updated}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("❌ autofill failed:", e);
  process.exit(1);
});
