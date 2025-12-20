import fs from "fs";
import path from "path";

const filePath = path.resolve("src/data/archetypesCatalog.json");
const raw = fs.readFileSync(filePath, "utf-8");

let repaired = null;
let cutAt = null;

// Try trimming from the end until JSON parses.
// This repairs “extra characters after JSON”, which is your exact error.
for (let i = raw.length; i > 0; i--) {
  const candidate = raw.slice(0, i).trim();
  try {
    const parsed = JSON.parse(candidate);
    if (parsed && (Array.isArray(parsed) || typeof parsed === "object")) {
      repaired = parsed;
      cutAt = i;
      break;
    }
  } catch {}
}

if (!repaired) {
  console.error("❌ Repair failed: No valid JSON found at the start of the file.");
  process.exit(1);
}

// Backup the broken file first
const backupPath = filePath.replace(/\.json$/i, `.broken.${Date.now()}.json`);
fs.writeFileSync(backupPath, raw, "utf-8");

// Rewrite clean JSON
fs.writeFileSync(filePath, JSON.stringify(repaired, null, 2), "utf-8");

console.log("✅ Repaired archetypesCatalog.json");
console.log("• Backup saved to:", backupPath);
console.log("• Cut position:", cutAt);
console.log("• Root type:", Array.isArray(repaired) ? "array" : "object");
console.log("• Entries:", Array.isArray(repaired) ? repaired.length : Object.keys(repaired).length);
