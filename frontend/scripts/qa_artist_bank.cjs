/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function main() {
  const blueprintPath = path.join(__dirname, "..", "data", "tests", "artist_v1.blueprint.json");
  const bankPath = path.join(__dirname, "..", "data", "tests", "artist_v1.bank.json");

  const blueprint = loadJson(blueprintPath);
  const bank = loadJson(bankPath);

  const likertIds = [];
  for (const cat of blueprint.categories) {
    for (const q of cat.questions) {
      if (q.type === "likert") likertIds.push(q.questionId);
    }
  }

  const bankMap = new Map(bank.map(b => [b.slotId, b]));

  // 1) Missing slots
  const missing = likertIds.filter(id => !bankMap.has(id));
  if (missing.length) {
    console.error("❌ Missing slots in bank:", missing);
    process.exit(1);
  }

  // 2) Variant count + duplicates + basic meaning safety
  for (const id of likertIds) {
    const entry = bankMap.get(id);
    const variants = entry.variants || [];
    const uniq = new Set(variants.map(v => v.trim()));

    if (variants.length < 8) {
      console.error(`❌ Slot ${id} has <8 variants (${variants.length})`);
      process.exit(1);
    }
    if (uniq.size !== variants.length) {
      console.error(`❌ Slot ${id} has duplicate variants`);
      process.exit(1);
    }

    // Basic guardrails: no extreme absolutes unless you explicitly want them
    const forbidden = ["always", "never"];
    for (const v of variants) {
      const low = v.toLowerCase();
      if (forbidden.some(w => low.includes(` ${w} `))) {
        console.error(`❌ Slot ${id} contains extreme absolute ("always/never") variant: ${v}`);
        process.exit(1);
      }
      if (v.length < 15) {
        console.error(`❌ Slot ${id} has too-short variant: ${v}`);
        process.exit(1);
      }
    }
  }

  console.log(`✅ QA PASS: bank covers ${likertIds.length} Likert slots; all have >=8 unique variants and basic safety checks passed.`);
}

main();
