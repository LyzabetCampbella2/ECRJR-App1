// backend/scripts/seedLoreFromJson.replaceOne.bulkWrite.mjs
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import LoreEntry from "../models/LoreEntry.js";

dotenv.config();

const FILE = process.argv[2] || path.resolve("data", "lore.archetypes.900.json");
const BATCH_SIZE = Number(process.argv[3] || 500); // you can pass 200/500/1000

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI missing in .env");
  process.exit(1);
}

function sanitizeDoc(it) {
  // ensure we don't carry Mongo-managed fields
  const doc = { ...(it || {}) };
  delete doc._id;
  delete doc.__v;
  delete doc.createdAt;
  delete doc.updatedAt;

  // harden arrays
  doc.symbols = Array.isArray(doc.symbols) ? doc.symbols : [];
  doc.motifs = Array.isArray(doc.motifs) ? doc.motifs : [];

  // basic required
  doc.type = String(doc.type || "").trim();
  doc.tag = String(doc.tag || "").trim();
  doc.name = String(doc.name || "").trim();

  if (!doc.type || !doc.tag || !doc.name) return null;

  // defaults
  doc.tagline = doc.tagline || "";
  doc.oneLine = doc.oneLine || "";
  doc.lore = doc.lore || "";
  doc.science = doc.science || {};
  doc.version = typeof doc.version === "number" ? doc.version : 1;
  doc.lastEditedBy = doc.lastEditedBy || "seed";

  return doc;
}

async function main() {
  const raw = fs.readFileSync(FILE, "utf8");
  const items = JSON.parse(raw);

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Mongo connected");

  let ops = [];
  let processed = 0;
  let batches = 0;

  const flush = async () => {
    if (!ops.length) return;
    batches++;
    const res = await LoreEntry.bulkWrite(ops, { ordered: false });
    console.log(
      `✅ batch ${batches} — ops=${ops.length} inserted=${res.upsertedCount || 0} modified=${res.modifiedCount || 0} matched=${res.matchedCount || 0}`
    );
    ops = [];
  };

  for (const it of items) {
    const doc = sanitizeDoc(it);
    if (!doc) continue;

    ops.push({
      replaceOne: {
        filter: { type: doc.type, tag: doc.tag },
        replacement: doc,
        upsert: true,
      },
    });

    processed++;
    if (ops.length >= BATCH_SIZE) await flush();
    if (processed % 200 === 0) console.log(`… queued ${processed}/${items.length}`);
  }

  await flush();

  console.log(`✅ Done. Processed ${processed} docs.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("❌ bulkWrite seed failed:", e);
  process.exit(1);
});
