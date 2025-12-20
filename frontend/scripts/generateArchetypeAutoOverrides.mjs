import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "src", "data");
const CATALOG = path.join(DATA_DIR, "archetypesCatalog.json");
const OUT = path.join(DATA_DIR, "archetypesOverrides.json");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function titleFromId(id) {
  // arch_0001 -> "Archetype 0001"
  const n = (id.split("_")[1] || id).replace(/^0+/, "") || id;
  const padded = (id.split("_")[1] || id).toUpperCase();
  return `Archetype ${padded}`;
}

function safeLoreBase(id, name) {
  return {
    oneLiner: `${name} — a core pattern within the Eirden archetype atlas.`,
    overview:
      "This entry is a placeholder profile while lore is being rebuilt. Add gifts, risks, healer path, alchemy notes, and prompts to complete it.",
    gifts: [],
    risks: [],
    healerPath: "",
    alchemyNotes: "",
    prompts: []
  };
}

const catalog = readJson(CATALOG);
const overrides = fs.existsSync(OUT) ? readJson(OUT) : {};

let touched = 0;

for (const e of catalog) {
  const id = e.id;
  const current = overrides[id] || {};

  const nameIsStub = !e.name || e.name === e.id || e.name === `arch_${id.split("_")[1]}`;
  const loreIsBlank =
    !e.lore ||
    (!e.lore.oneLiner && !e.lore.overview && (!e.lore.gifts || e.lore.gifts.length === 0));

  // Only fill missing/stub stuff so your manual edits always win
  const next = { ...current };

  if (!current.name && nameIsStub) {
    next.name = titleFromId(id);
  }

  if (!current.lore && loreIsBlank) {
    next.lore = safeLoreBase(id, next.name || e.name || id);
  } else if (current.lore) {
    // keep existing override lore
  } else if (!current.lore && e.lore) {
    // if catalog has partial lore, don't overwrite it here
  }

  if (Object.keys(next).length > 0) {
    overrides[id] = next;
    touched++;
  }
}

fs.writeFileSync(OUT, JSON.stringify(overrides, null, 2), "utf-8");
console.log(`✅ Wrote/updated overrides: ${OUT}`);
console.log(`• Entries touched: ${touched}`);
console.log(`• Total overrides: ${Object.keys(overrides).length}`);
