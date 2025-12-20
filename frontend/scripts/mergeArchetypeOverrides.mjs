import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "src", "data");

const GENERATED = path.join(DATA_DIR, "archetypesCatalog.generated.json");
const OVERRIDES = path.join(DATA_DIR, "archetypesOverrides.json");
const OUT = path.join(DATA_DIR, "archetypesCatalog.json");

function readJson(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

// Deep merge where overrides win; arrays override entirely (simplest, safest)
function mergeDeep(base, override) {
  if (Array.isArray(base) || Array.isArray(override)) {
    return override !== undefined ? override : base;
  }
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override !== undefined ? override : base;
  }
  const out = { ...base };
  for (const k of Object.keys(override)) {
    out[k] = mergeDeep(base[k], override[k]);
  }
  return out;
}

const generatedArr = readJson(GENERATED, []);
const overridesObj = readJson(OVERRIDES, {}); // keyed by id

if (!Array.isArray(generatedArr)) {
  console.error("❌ generated catalog must be an array:", GENERATED);
  process.exit(1);
}

const merged = generatedArr.map((entry) => {
  const o = overridesObj?.[entry.id];
  return o ? mergeDeep(entry, o) : entry;
});

fs.writeFileSync(OUT, JSON.stringify(merged, null, 2), "utf-8");
console.log(`✅ Merged overrides into catalog: ${OUT}`);
console.log(`• Generated entries: ${generatedArr.length}`);
console.log(`• Overrides entries: ${Object.keys(overridesObj || {}).length}`);
