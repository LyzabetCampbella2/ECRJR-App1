import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const ROOT = process.cwd();

const IDS_PATH = path.join(ROOT, "src", "data", "archetypeIds.json");

// We will merge from the "best available" existing catalog.
// Priority: src/data (developer source) then public/data (served)
const SRC_CATALOG = path.join(ROOT, "src", "data", "archetypesCatalog.json");
const PUB_DIR = path.join(ROOT, "public", "data");
const PUB_CATALOG = path.join(PUB_DIR, "archetypesCatalog.json");
const OVERRIDES_PATH = path.join(ROOT, "src", "data", "archetypeOverrides.js");

async function loadOverrides() {
  if (!fs.existsSync(OVERRIDES_PATH)) return {};
  const mod = await import(pathToFileURL(OVERRIDES_PATH).href);
  return mod.ARCHETYPE_OVERRIDES || {};
}

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function isNonEmptyString(s) {
  return typeof s === "string" && s.trim().length > 0;
}

function hasRichLore(entry) {
  const lore = entry?.lore || {};
  return (
    isNonEmptyString(lore.oneLiner) ||
    isNonEmptyString(lore.overview) ||
    (Array.isArray(lore.gifts) && lore.gifts.length) ||
    (Array.isArray(lore.risks) && lore.risks.length) ||
    (Array.isArray(lore.prompts) && lore.prompts.length) ||
    isNonEmptyString(lore.healerPath) ||
    isNonEmptyString(lore.alchemyNotes)
  );
}

function isStubName(name, id) {
  if (!isNonEmptyString(name)) return true;
  const n = name.trim().toLowerCase();
  const i = String(id || "").trim().toLowerCase();
  return n === i || n.startsWith("arch_");
}

function mergePreferRich(oldEntry, newEntry) {
  // Goal: never overwrite rich data with empties.
  const merged = { ...newEntry, ...oldEntry }; // old wins by default

  // Name: prefer non-stub old name; else use new
  const oldName = oldEntry?.name;
  const newName = newEntry?.name;
  if (!isStubName(oldName, oldEntry?.id) && isNonEmptyString(oldName)) merged.name = oldName;
  else if (isNonEmptyString(newName)) merged.name = newName;

  // Simple fields: if old is empty, take new
  for (const k of ["family", "tier"]) {
    if (!isNonEmptyString(oldEntry?.[k]) && isNonEmptyString(newEntry?.[k])) merged[k] = newEntry[k];
  }

  // Arrays: union unique (prefer old ordering)
  for (const k of ["tags"]) {
    const a = Array.isArray(oldEntry?.[k]) ? oldEntry[k] : [];
    const b = Array.isArray(newEntry?.[k]) ? newEntry[k] : [];
    merged[k] = Array.from(new Set([...a, ...b]));
  }

  // Nested objects: signals/links — merge arrays
  merged.signals = merged.signals || { luminary: [], shadow: [] };
  merged.links = merged.links || { opposites: [], allies: [], evolutions: { from: [], to: [] } };

  const oldSig = oldEntry?.signals || {};
  const newSig = newEntry?.signals || {};
  merged.signals.luminary = Array.from(new Set([...(oldSig.luminary || []), ...(newSig.luminary || [])]));
  merged.signals.shadow = Array.from(new Set([...(oldSig.shadow || []), ...(newSig.shadow || [])]));

  const oldLinks = oldEntry?.links || {};
  const newLinks = newEntry?.links || {};
  merged.links.opposites = Array.from(new Set([...(oldLinks.opposites || []), ...(newLinks.opposites || [])]));
  merged.links.allies = Array.from(new Set([...(oldLinks.allies || []), ...(newLinks.allies || [])]));

  merged.links.evolutions = merged.links.evolutions || { from: [], to: [] };
  const oe = oldLinks.evolutions || {};
  const ne = newLinks.evolutions || {};
  merged.links.evolutions.from = Array.from(new Set([...(oe.from || []), ...(ne.from || [])]));
  merged.links.evolutions.to = Array.from(new Set([...(oe.to || []), ...(ne.to || [])]));

  // Lore: if old has rich lore, keep it. Else use new lore.
  const oldLore = oldEntry?.lore || {};
  const newLore = newEntry?.lore || {};
  merged.lore = merged.lore || {};
  if (hasRichLore(oldEntry)) {
    merged.lore = { ...newLore, ...oldLore };
  } else {
    merged.lore = { ...oldLore, ...newLore };
  }

  // Meta: always refresh updatedAt, preserve old source if present
  merged.meta = merged.meta || {};
  merged.meta.updatedAt = new Date().toISOString();
  if (isNonEmptyString(oldEntry?.meta?.source)) merged.meta.source = oldEntry.meta.source;

  return merged;
}

function makeStub(id) {
  return {
    id,
    name: id,
    family: "Unassigned",
    tier: "Common",
    tags: [],
    signals: { luminary: [], shadow: [] },
    links: { opposites: [], allies: [], evolutions: { from: [], to: [] } },
    lore: {
      oneLiner: "",
      overview: "",
      gifts: [],
      risks: [],
      healerPath: "",
      alchemyNotes: "",
      prompts: []
    },
    meta: { updatedAt: new Date().toISOString(), source: "merge" }
  };
}

if (!fs.existsSync(IDS_PATH)) {
  console.error("❌ Missing archetypeIds.json:", IDS_PATH);
  process.exit(1);
}

const ids = readJson(IDS_PATH);
if (!Array.isArray(ids) || ids.length === 0) {
  console.error("❌ archetypeIds.json is empty/invalid");
  process.exit(1);
}

const srcExisting = readJson(SRC_CATALOG);
const pubExisting = readJson(PUB_CATALOG);

const existing =
  Array.isArray(srcExisting) ? srcExisting :
  Array.isArray(pubExisting) ? pubExisting :
  [];

const byId = new Map(existing.map((e) => [e?.id, e]).filter(([id]) => !!id));

const merged = ids.map((id) => {
  const current = byId.get(id);
  const stub = makeStub(id);
  return current ? mergePreferRich(current, stub) : stub;
});

// Ensure folders exist
fs.mkdirSync(path.dirname(SRC_CATALOG), { recursive: true });
fs.mkdirSync(PUB_DIR, { recursive: true });

// Write outputs
fs.writeFileSync(SRC_CATALOG, JSON.stringify(merged, null, 2), "utf-8");
fs.writeFileSync(PUB_CATALOG, JSON.stringify(merged, null, 2), "utf-8");

// Stats
const richCount = merged.filter((e) => (e?.name && !isStubName(e.name, e.id)) || hasRichLore(e)).length;

console.log("✅ Merge complete");
console.log("• IDs:", ids.length);
console.log("• Existing used:", existing.length);
console.log("• Rich entries kept:", richCount);
console.log("• Wrote:", SRC_CATALOG);
console.log("• Wrote:", PUB_CATALOG);
