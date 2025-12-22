// backend/scripts/seedArchetypes.mjs
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Archetype from "../models/Archetype.js";

dotenv.config();

const fileArg = process.argv[2];
if (!fileArg) {
  console.error("❌ Please provide path to lore.archetypes.json");
  process.exit(1);
}

const fullPath = path.resolve(fileArg);

async function run() {
  console.log("📄 Loading:", fullPath);

  if (!fs.existsSync(fullPath)) {
    console.error("❌ File not found:", fullPath);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Mongo connected");

  const raw = fs.readFileSync(fullPath, "utf8");
  const items = JSON.parse(raw);

  const ops = items.map((doc) => ({
    updateOne: {
      filter: { id: doc.id },
      update: { $set: doc },
      upsert: true
    }
  }));

  const res = await Archetype.bulkWrite(ops, { ordered: false });
  console.log("✅ Seed complete");
  console.log("• Upserted:", res.upsertedCount ?? 0);
  console.log("• Modified:", res.modifiedCount ?? 0);

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
