import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const IDS_PATH = path.resolve("src/data/archetypeIds.json");
const CATALOG_PATH = path.resolve("src/data/archetypesCatalog.json");

const DEFAULT_SCAN_DIRS = [
  "src/data",
  "backend/data",
  "backend",
  "src/pages",
  "src"
].map(p => path.resolve(p)).filter(p => fs.existsSync(p));

const ID_PATTERNS = [
  /^arch_\d{3,}$/i
];

function isId(s) {
  if (typeof s !== "string") return false;
  const t = s.trim();
  return ID_PATTERNS.some(rx => rx.test(t));
}

function walkAny(value, found) {
  if (value == null) return;
  if (typeof value === "string") {
    if (isId(value)) found.add(value.trim());
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) walkAny(v, found);
    return;
  }
  if (typeof value === "object") {
    for (const k of Object.keys(value)) {
      walkAny(value[k], found);
    }
  }
}

function listFilesRecursive(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    let items = [];
    try { items = fs.readdirSync(d, { withFileTypes: true }); } catch { continue; }
    for (const it of items) {
      const full = path.join(d, it.name);
      if (it.isDirectory()) {
        // skip heavy folders
        if (it.name === "node_modules" || it.name === ".git" || it.name === "dist" || it.name === "build") continue;
        stack.push(full);
      } else {
        out.push(full);
      }
    }
  }
  return out;
}

function safeReadJson(file) {
  try {
    const txt = fs.readFileSync(file, "utf-8");
    // ignore huge non-json
    const trimmed = txt.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

function nowISO() { return new Date().toISOString(); }

function ensureCatalogEntry(entry, id) {
  entry.id = id;

  entry.name ||= id;
  entry.family ||= "Unassigned";
  entry.tier ||= "Common";
  entry.tags ||= [];
  entry.signals ||= { luminary: [], shadow: [] };

  entry.links ||= {};
  entry.links.opposites ||= [];
  entry.links.allies ||= [];
  entry.links.evolutions ||= { from: [], to: [] };

  entry.lore ||= {
    oneLiner: "",
    overview: "",
    gifts: [],
    risks: [],
    healerPath: "",
    alchemyNotes: "",
    prompts: []
  };

  entry.meta ||= { updatedAt: nowISO(), source: "test" };
  entry.meta.updatedAt = nowISO();
  entry.meta.source ||= "test";

  return entry;
}

/**
 * Merge rule:
 * - Never overwrite existing name if it's not equal to id
 * - Never overwrite lore if any meaningful field exists
 * - Only fill missing fields / defaults
 */
function mergeEntry(existing, stub) {
  const out = { ...existing };

  // basics
  out.family ||= stub.family;
  out.tier ||= stub.tier;

  // name: preserve manual
  if (!out.name || out.name === out.id) out.name = stub.name;

  // tags: union
  out.tags = Array.from(new Set([...(out.tags || []), ...(stub.tags || [])]));

  // signals: union
  out.signals ||= { luminary: [], shadow: [] };
  out.signals.luminary = Array.from(new Set([...(out.signals.luminary || []), ...(stub.signals?.luminary || [])]));
  out.signals.shadow = Array.from(new Set([...(out.signals.shadow || []), ...(stub.signals?.shadow || [])]));

  // links: union
  out.links ||= {};
  out.links.opposites = Array.from(new Set([...(out.links.opposites || []), ...(stub.links?.opposites || [])]));
  out.links.allies = Array.from(new Set([...(out.links.allies || []), ...(stub.links?.allies || [])]));

  out.links.evolutions ||= { from: [], to: [] };
  out.links.evolutions.from = Array.from(new Set([...(out.links.evolutions.from || []), ...(stub.links?.evolutions?.from || [])]));
  out.links.evolutions.to = Array.from(new Set([...(out.links.evolutions.to || []), ...(stub.links?.evolutions?.to || [])]));

  // lore: preserve if meaningful
  out.lore ||= {};
  const meaningfulLore =
    (out.lore.oneLiner && out.lore.oneLiner.trim()) ||
    (out.lore.overview && out.lore.overview.trim()) ||
    (Array.isArray(out.lore.gifts) && out.lore.gifts.length) ||
    (Array.isArray(out.lore.risks) && out.lore.risks.length);

  if (!meaningfulLore) {
    out.lore = { ...stub.lore, ...out.lore };
  } else {
    // still fill missing keys
    for (const k of Object.keys(stub.lore || {})) {
      if (out.lore[k] == null || out.lore[k] === "") out.lore[k] = stub.lore[k];
    }
  }

  // meta
  out.meta ||= {};
  out.meta.source ||= existing?.meta?.source || stub?.meta?.source || "test";
  out.meta.updatedAt = nowISO();

  return out;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = new Set(args);
  return {
    idsOnly: flags.has("--ids-only"),
    scanDirs: DEFAULT_SCAN_DIRS
  };
}

const { idsOnly, scanDirs } = parseArgs();

// Load catalog
let catalog = [];
if (fs.existsSync(CATALOG_PATH)) {
  try { catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf-8")); } catch { catalog = []; }
}
if (!Array.isArray(catalog)) catalog = [];

const catalogMap = new Map(catalog.map(e => [e.id, e]));

// Discover IDs by scanning JSON files
const found = new Set();

// include existing ids
for (const e of catalog) if (e?.id) found.add(e.id);

// scan dirs
for (const dir of scanDirs) {
  const files = listFilesRecursive(dir).filter(f => f.toLowerCase().endsWith(".json"));
  for (const f of files) {
    const json = safeReadJson(f);
    if (!json) continue;
    walkAny(json, found);
  }
}

const ids = Array.from(found).filter(Boolean).sort((a, b) => a.localeCompare(b));

// write archetypeIds.json
fs.mkdirSync(path.dirname(IDS_PATH), { recursive: true });
fs.writeFileSync(IDS_PATH, JSON.stringify(ids, null, 2), "utf-8");

// if idsOnly, stop here
if (idsOnly) {
  console.log(`✅ IDs sync complete. IDs: ${ids.length}`);
  console.log(`• IDs: ${IDS_PATH}`);
  process.exit(0);
}

// ensure catalog entries exist for every id
let added = 0;
for (const id of ids) {
  const existing = catalogMap.get(id);
  const stub = ensureCatalogEntry({ id }, id);

  if (!existing) {
    catalogMap.set(id, stub);
    added++;
  } else {
    catalogMap.set(id, mergeEntry(existing, stub));
  }
}

// save catalog
const out = Array.from(catalogMap.values()).sort((a, b) => (a.id || "").localeCompare(b.id || ""));
fs.writeFileSync(CATALOG_PATH, JSON.stringify(out, null, 2), "utf-8");

console.log(`✅ Sync complete.`);
console.log(`• IDs: ${ids.length} (${IDS_PATH})`);
console.log(`• Catalog entries: ${out.length} (${CATALOG_PATH})`);
console.log(`• Added stubs: ${added}`);
