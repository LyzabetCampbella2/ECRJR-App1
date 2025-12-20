import fs from "fs";
import path from "path";

const CATALOG_PATH = path.resolve("src/data/archetypesCatalog.json");

function uniq(arr) {
  return Array.from(new Set((arr || []).filter(Boolean)));
}

function nowISO() {
  return new Date().toISOString();
}

const entries = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf-8"));
if (!Array.isArray(entries)) {
  throw new Error("archetypesCatalog.json must be a JSON array of entries.");
}

const byId = new Map(entries.map((e) => [e.id, e]));

function ensure(id) {
  const e = byId.get(id);
  if (!e) return null;

  e.links ||= {};
  e.links.opposites = uniq(e.links.opposites);
  e.links.allies = uniq(e.links.allies);

  e.links.evolutions ||= { from: [], to: [] };
  e.links.evolutions.from = uniq(e.links.evolutions.from);
  e.links.evolutions.to = uniq(e.links.evolutions.to);

  e.meta ||= {};
  e.meta.source ||= "seed";
  e.meta.updatedAt ||= nowISO();

  return e;
}

function addUniq(arr, v) {
  if (!arr.includes(v)) arr.push(v);
}

let fixes = 0;

for (const e of entries) {
  if (!e?.id) continue;
  ensure(e.id);

  // Drop links to unknown IDs
  e.links.opposites = (e.links.opposites || []).filter((id) => byId.has(id));
  e.links.allies = (e.links.allies || []).filter((id) => byId.has(id));
  e.links.evolutions.from = (e.links.evolutions.from || []).filter((id) => byId.has(id));
  e.links.evolutions.to = (e.links.evolutions.to || []).filter((id) => byId.has(id));

  // Opposites reciprocal
  for (const o of e.links.opposites) {
    const other = ensure(o);
    if (other) {
      addUniq(other.links.opposites, e.id);
      fixes++;
    }
  }

  // Allies reciprocal
  for (const a of e.links.allies) {
    const other = ensure(a);
    if (other) {
      addUniq(other.links.allies, e.id);
      fixes++;
    }
  }

  // Evolutions reciprocal: to <-> from
  for (const to of e.links.evolutions.to) {
    const other = ensure(to);
    if (other) {
      addUniq(other.links.evolutions.from, e.id);
      fixes++;
    }
  }

  for (const from of e.links.evolutions.from) {
    const other = ensure(from);
    if (other) {
      addUniq(other.links.evolutions.to, e.id);
      fixes++;
    }
  }

  e.meta.updatedAt = nowISO();
}

// Write back (sorted by id for stability)
const out = [...byId.values()].sort((a, b) => (a.id || "").localeCompare(b.id || ""));
fs.writeFileSync(CATALOG_PATH, JSON.stringify(out, null, 2), "utf-8");

console.log(`✅ Link normalization complete. Fix operations: ${fixes}`);
