// backend/scripts/seedLoreFromJson.replaceOne.bulkWrite.mjs
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import LoreEntry from "../models/LoreEntry.js";

dotenv.config();

const FILE = process.argv[2] || path.resolve("data", "lore.archetypes.900.json");
const BATCH_SIZE = Number(process.argv[3] || 500);

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI missing in .env");
  process.exit(1);
}

function sanitizeDoc(it) {
  const doc = { ...(it || {}) };
  delete doc._id;
  delete doc.__v;
  delete doc.createdAt;
  delete doc.updatedAt;

  doc.type = String(doc.type || "").trim();
  doc.tag = String(doc.tag || "").trim();
  doc.name = String(doc.name || "").trim();
  if (!doc.type || !doc.tag || !doc.name) return null;

  doc.tagline = doc.tagline || "";
  doc.oneLine = doc.oneLine || "";
  doc.lore = doc.lore || "";
  doc.symbols = Array.isArray(doc.symbols) ? doc.symbols : [];
  doc.motifs = Array.isArray(doc.motifs) ? doc.motifs : [];
  doc.science = doc.science || {};
  doc.version = typeof doc.version === "number" ? doc.version : 1;
  doc.lastEditedBy = doc.lastEditedBy || "seed";

  // IMPORTANT: do NOT include "id" unless you truly use it.
  // If your DB has a unique index on id, missing id behaves like null -> duplicates.
  delete doc.id;

  return doc;
}

async function ensureIndexes() {
  const c = mongoose.connection.db.collection("loreentries");
  const idx = await c.indexes();

  const names = idx.map((i) => i.name);
  console.log("ℹ️ existing indexes:", names);

  // Drop bad unique index on id if present
  if (names.includes("id_1")) {
    await c.dropIndex("id_1");
    console.log("✅ dropped index id_1");
  }

  // Ensure correct unique index
  if (!names.includes("type_1_tag_1")) {
    try {
      await c.createIndex({ type: 1, tag: 1 }, { unique: true, name: "type_1_tag_1" });
      console.log("✅ created unique index type_1_tag_1");
    } catch (e) {
      console.log("ℹ️ createIndex type_1_tag_1 skipped:", e?.message || e);
    }
  }
}

async function main() {
  const raw = fs.readFileSync(FILE, "utf8");
  const items = JSON.parse(raw);

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Mongo connected");

  await ensureIndexes();

  let ops = [];
  let processed = 0;
  let batch = 0;

  const flush = async () => {
    if (!ops.length) return;
    batch++;
    const res = await LoreEntry.bulkWrite(ops, { ordered: false });
    console.log(
      `✅ batch ${batch} | ops=${ops.length} | upserted=${res.upsertedCount || 0} | modified=${res.modifiedCount || 0}`
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

  console.log(`✅ Done. Processed ${processed} lore entries.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("❌ bulkWrite failed:", e);
  process.exit(1);
});
