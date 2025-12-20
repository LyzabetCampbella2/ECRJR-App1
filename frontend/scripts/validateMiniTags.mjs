import fs from "fs";
import path from "path";

const lumPath = path.join(process.cwd(), "data", "luminary.catalog.json");
const shaPath = path.join(process.cwd(), "data", "shadow.catalog.json");
const miniPath = path.join(process.cwd(), "data", "miniTests.lumiShadow.json");

const lum = JSON.parse(fs.readFileSync(lumPath, "utf-8"));
const sha = JSON.parse(fs.readFileSync(shaPath, "utf-8"));
const mini = JSON.parse(fs.readFileSync(miniPath, "utf-8"));

function collectCatalogTags(catalog) {
  const set = new Set();
  for (const a of catalog) {
    const tags = a?.tags || {};
    for (const k of Object.keys(tags)) set.add(k);
  }
  return set;
}

function collectMiniTags(miniObj, side /* "lum" | "sha" */) {
  const used = new Set();
  for (const block of Object.values(miniObj)) {
    for (const q of block.questions || []) {
      for (const opt of q.options || []) {
        const t = opt?.[side] || {};
        for (const k of Object.keys(t)) used.add(k);
      }
    }
  }
  return used;
}

const lumTags = collectCatalogTags(lum);
const shaTags = collectCatalogTags(sha);

const usedLum = collectMiniTags(mini, "lum");
const usedSha = collectMiniTags(mini, "sha");

const missingLum = [...usedLum].filter((t) => !lumTags.has(t)).sort();
const missingSha = [...usedSha].filter((t) => !shaTags.has(t)).sort();

console.log("✅ Catalog tags:");
console.log("  Luminary tags:", lumTags.size);
console.log("  Shadow tags:", shaTags.size);

console.log("\n✅ Mini-test tags used:");
console.log("  Lum tags used:", usedLum.size);
console.log("  Sha tags used:", usedSha.size);

if (missingLum.length) {
  console.log("\n❌ Missing LUM tags (used in mini tests but not in luminary catalog):");
  console.log(missingLum.join(", "));
} else {
  console.log("\n✅ All mini LUM tags exist in luminary catalog.");
}

if (missingSha.length) {
  console.log("\n❌ Missing SHA tags (used in mini tests but not in shadow catalog):");
  console.log(missingSha.join(", "));
} else {
  console.log("\n✅ All mini SHA tags exist in shadow catalog.");
}
