import fs from "fs";
import path from "path";

const CATALOG_PATH = path.resolve("src/data/archetypesCatalog.json");
const OUT_DIR = path.resolve("src/data/archetypesByFamily");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

const entries = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf-8"));

ensureDir(OUT_DIR);

const byFamily = {};
for (const e of entries) {
  const fam = e.family || "Unassigned";
  byFamily[fam] ||= [];
  byFamily[fam].push(e);
}

for (const fam of Object.keys(byFamily)) {
  const safe = fam.replace(/[^\w\-]+/g, "_");
  fs.writeFileSync(path.join(OUT_DIR, `${safe}.json`), JSON.stringify(byFamily[fam], null, 2), "utf-8");
}

fs.writeFileSync(
  path.join(OUT_DIR, `index.json`),
  JSON.stringify(
    Object.fromEntries(Object.entries(byFamily).map(([k, v]) => [k, v.map(x => x.id)])),
    null,
    2
  ),
  "utf-8"
);

console.log(`✅ Exported families to ${OUT_DIR}`);
