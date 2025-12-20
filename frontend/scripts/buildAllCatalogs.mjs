import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const ROOT = process.cwd();
const PUB = path.join(ROOT, "public", "data");
fs.mkdirSync(PUB, { recursive: true });

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}
function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf-8");
}

async function loadOverrides(relPath, exportName) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) return {};
  const mod = await import(pathToFileURL(abs).href);
  return mod?.[exportName] || {};
}

function stubArchetype(id) {
  return {
    id,
    name: id,
    family: "Unassigned",
    tier: "Common",
    tags: [],
    signals: { luminary: [], shadow: [] },
    links: { opposites: [], allies: [], evolutions: { from: [], to: [] } },
    lore: { oneLiner: "", overview: "", gifts: [], risks: [], healerPath: "", alchemyNotes: "", prompts: [] },
    meta: { updatedAt: new Date().toISOString(), source: "buildAllCatalogs" }
  };
}

function stubLuminary(id) {
  return {
    id,
    name: id,
    domain: "Unassigned",
    tags: [],
    links: { archetypes: [], shadows: [] },
    lore: { oneLiner: "", overview: "", gifts: [], risks: [], prompts: [] },
    meta: { updatedAt: new Date().toISOString(), source: "buildAllCatalogs" }
  };
}

function stubShadow(id) {
  return {
    id,
    name: id,
    domain: "Unassigned",
    tags: [],
    links: { archetypes: [], luminaries: [] },
    lore: { oneLiner: "", overview: "", triggers: [], distortions: [], healerPath: "", prompts: [] },
    meta: { updatedAt: new Date().toISOString(), source: "buildAllCatalogs" }
  };
}

// merge: never overwrite filled fields with empty ones
function mergePreferFilled(base, override) {
  const out = { ...base };

  for (const [k, v] of Object.entries(override || {})) {
    if (v == null) continue;

    if (Array.isArray(v)) {
      const a = Array.isArray(out[k]) ? out[k] : [];
      out[k] = Array.from(new Set([...a, ...v]));
      continue;
    }

    if (typeof v === "object" && !Array.isArray(v)) {
      out[k] = mergePreferFilled(out[k] || {}, v);
      continue;
    }

    // primitives: only replace if override is non-empty
    if (typeof v === "string") {
      if (v.trim().length) out[k] = v;
    } else {
      out[k] = v;
    }
  }

  out.meta = out.meta || {};
  out.meta.updatedAt = new Date().toISOString();
  return out;
}

async function buildCatalog({ idsPath, existingPath, overridesPath, overridesExport, stubFn, outName }) {
  const ids = readJson(idsPath);
  if (!Array.isArray(ids) || !ids.length) throw new Error(`IDs missing/empty: ${idsPath}`);

  const existing = readJson(existingPath);
  const byId = new Map((Array.isArray(existing) ? existing : []).map((e) => [e?.id, e]).filter(([id]) => !!id));

  const overrides = await loadOverrides(overridesPath, overridesExport);

  const built = ids.map((id) => {
    const base = byId.get(id) ? mergePreferFilled(stubFn(id), byId.get(id)) : stubFn(id);
    const over = overrides?.[id];
    return over ? mergePreferFilled(base, { ...over, id }) : base;
  });

  const outPath = path.join(PUB, outName);
  writeJson(outPath, built);

  console.log(`✅ Wrote ${built.length} → public/data/${outName}`);
}

(async () => {
  await buildCatalog({
    idsPath: path.join(ROOT, "src", "data", "archetypeIds.json"),
    existingPath: path.join(PUB, "archetypesCatalog.json"),
    overridesPath: "src/data/archetypeOverrides.js",
    overridesExport: "ARCHETYPE_OVERRIDES",
    stubFn: stubArchetype,
    outName: "archetypesCatalog.json"
  });

  await buildCatalog({
    idsPath: path.join(ROOT, "src", "data", "luminaryIds.json"),
    existingPath: path.join(PUB, "luminariesCatalog.json"),
    overridesPath: "src/data/luminaryOverrides.js",
    overridesExport: "LUMINARY_OVERRIDES",
    stubFn: stubLuminary,
    outName: "luminariesCatalog.json"
  });

  await buildCatalog({
    idsPath: path.join(ROOT, "src", "data", "shadowIds.json"),
    existingPath: path.join(PUB, "shadowsCatalog.json"),
    overridesPath: "src/data/shadowOverrides.js",
    overridesExport: "SHADOW_OVERRIDES",
    stubFn: stubShadow,
    outName: "shadowsCatalog.json"
  });
})().catch((e) => {
  console.error("❌ buildAllCatalogs failed:", e.message);
  process.exit(1);
});
