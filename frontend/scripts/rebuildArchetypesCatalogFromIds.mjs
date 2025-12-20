import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SRC_DATA = path.join(ROOT, "src", "data");
const IDS = path.join(SRC_DATA, "archetypeIds.json");

const OUT_SRC = path.join(SRC_DATA, "archetypesCatalog.json");
const OUT_PUB_DIR = path.join(ROOT, "public", "data");
const OUT_PUB = path.join(OUT_PUB_DIR, "archetypesCatalog.json");

function titleFromId(id) {
  const suffix = String(id).split("_")[1] || id;
  return `Archetype ${suffix}`;
}

if (!fs.existsSync(IDS)) {
  console.error("❌ Missing:", IDS);
  process.exit(1);
}

const ids = JSON.parse(fs.readFileSync(IDS, "utf-8"));
if (!Array.isArray(ids) || ids.length === 0) {
  console.error("❌ archetypeIds.json empty/invalid");
  process.exit(1);
}

const now = new Date().toISOString();
const built = ids.map((id) => ({
  id,
  name: titleFromId(id),
  family: "Unassigned",
  tier: "Common",
  tags: [],
  signals: { luminary: [], shadow: [] },
  links: { opposites: [], allies: [], evolutions: { from: [], to: [] } },
  lore: {
    oneLiner: `${titleFromId(id)} — a core pattern within the Eirden atlas.`,
    overview: "Rebuilt placeholder entry. Add full lore next.",
    gifts: [],
    risks: [],
    healerPath: "",
    alchemyNotes: "",
    prompts: []
  },
  meta: { updatedAt: now, source: "rebuildFromIds" }
}));

fs.writeFileSync(OUT_SRC, JSON.stringify(built, null, 2), "utf-8");
fs.mkdirSync(OUT_PUB_DIR, { recursive: true });
fs.writeFileSync(OUT_PUB, JSON.stringify(built, null, 2), "utf-8");

console.log("✅ Catalog rebuilt");
console.log("• src:", OUT_SRC);
console.log("• public:", OUT_PUB);
console.log("• entries:", built.length);
