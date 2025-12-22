// backend/lib/magicEngine.js
/**
 * Magic Engine (v1.1)
 * -------------------
 * Loads magic libraries (worlds + ability packs) from JSON,
 * validates and expands a magic profile into:
 *   - world object
 *   - pack summaries
 *   - full ability list (pack abilities + unique abilities)
 *
 * Files used:
 *   backend/data/magic/worlds.v1.json
 *   backend/data/magic/abilityPacks.v1.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// -----------------------------
// Path helpers
// -----------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORLDS_PATH = path.join(__dirname, "..", "data", "magic", "worlds.v1.json");
const PACKS_PATH = path.join(__dirname, "..", "data", "magic", "abilityPacks.v1.json");

// -----------------------------
// Safe helpers
// -----------------------------
function safeObj(o) {
  return o && typeof o === "object" ? o : {};
}

function safeArr(a) {
  return Array.isArray(a) ? a : [];
}

function toNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function readJson(filepath, fallback = null) {
  try {
    const raw = fs.readFileSync(filepath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`⚠️ magicEngine: could not read JSON: ${filepath}`);
    console.warn("   ", err?.message || err);
    return fallback;
  }
}

function normalizeString(x) {
  return String(x || "").trim();
}

function abilityIdentity(a) {
  // Use id first; fallback to name
  const id = normalizeString(a?.id || a?.abilityId);
  if (id) return `id:${id}`;
  const nm = normalizeString(a?.name);
  if (nm) return `name:${nm}`;
  return "";
}

function dedupeAbilities(list) {
  const out = [];
  const seen = new Set();
  for (const a of safeArr(list)) {
    const key = abilityIdentity(a);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}

function coerceAbility(a) {
  const obj = safeObj(a);
  const id = normalizeString(obj.id || obj.abilityId);
  const name = normalizeString(obj.name);

  if (!id && !name) return null;

  return {
    id: id || undefined,
    name: name || "(Unnamed Ability)",
    type: normalizeString(obj.type) || "active",
    cost: normalizeString(obj.cost) || "none",
    cooldown: toNum(obj.cooldown),
    effect: normalizeString(obj.effect) || "",
    counter: normalizeString(obj.counter) || "",
    tags: safeArr(obj.tags).map(normalizeString).filter(Boolean),
    // freeform extra fields (kept if present)
    ...obj,
  };
}

// -----------------------------
// Library cache
// -----------------------------
let CACHE = null;

export function clearMagicCache() {
  CACHE = null;
}

/**
 * Loads:
 * - worlds.v1.json
 * - abilityPacks.v1.json
 *
 * Returns:
 * { worlds, packs, worldById, packById, meta }
 */
export function loadMagicLibrary({ forceReload = false } = {}) {
  if (CACHE && !forceReload) return CACHE;

  const worldsJson = readJson(WORLDS_PATH, { version: "missing", worlds: [] }) || {
    version: "missing",
    worlds: [],
  };
  const packsJson = readJson(PACKS_PATH, { version: "missing", packs: [] }) || {
    version: "missing",
    packs: [],
  };

  const worlds = safeArr(worldsJson.worlds);
  const packs = safeArr(packsJson.packs);

  const worldById = {};
  for (const w of worlds) {
    const worldId = normalizeString(w?.worldId);
    if (!worldId) continue;
    worldById[worldId] = w;
  }

  const packById = {};
  for (const p of packs) {
    const packId = normalizeString(p?.packId);
    if (!packId) continue;

    // Normalize abilities array
    const abilities = safeArr(p?.abilities).map(coerceAbility).filter(Boolean);

    packById[packId] = {
      ...p,
      packId,
      name: normalizeString(p?.name) || packId,
      tags: safeArr(p?.tags).map(normalizeString).filter(Boolean),
      abilities,
    };
  }

  CACHE = {
    worlds,
    packs: Object.values(packById),
    worldById,
    packById,
    meta: {
      worldsVersion: worldsJson.version || "unknown",
      packsVersion: packsJson.version || "unknown",
      worldsPath: WORLDS_PATH,
      packsPath: PACKS_PATH,
      loadedAt: new Date().toISOString(),
    },
  };

  return CACHE;
}

// -----------------------------
// Canonical Magic Profile builder
// -----------------------------
/**
 * This returns the EXACT structure you're using everywhere:
 * magic: {
 *   worldId,
 *   school,
 *   aspects: [],
 *   packIds: [],
 *   uniqueAbilities: []
 * }
 */
export function makeMagicProfile({
  worldId = "world_01_elyndra",
  school = "Sigilcraft",
  aspects = ["Star", "Veil"],
  packIds = ["pack_mystic_01"],
  uniqueAbilities = [],
} = {}) {
  return {
    worldId: normalizeString(worldId) || "world_01_elyndra",
    school: normalizeString(school) || "Sigilcraft",
    aspects: safeArr(aspects).map(normalizeString).filter(Boolean),
    packIds: safeArr(packIds).map(normalizeString).filter(Boolean),
    uniqueAbilities: safeArr(uniqueAbilities).map(coerceAbility).filter(Boolean),
  };
}

// -----------------------------
// Expansion
// -----------------------------
/**
 * Expands a magic profile into:
 * {
 *   worldId, school, aspects, packIds, uniqueAbilities,
 *   world: {...} | null,
 *   packs: [{ packId, name, tags }],
 *   abilities: [ ...abilities ]
 * }
 *
 * Notes:
 * - abilities are deduped by id (or name if id missing)
 * - uniqueAbilities can be 0–5 but we don’t hard-enforce here
 */
export function expandMagicProfile(magic = {}, opts = {}) {
  const { forceReload = false, includeMissingRefs = true } = safeObj(opts);
  const lib = loadMagicLibrary({ forceReload });

  const profile = makeMagicProfile(magic);

  // World
  const world = lib.worldById[profile.worldId] || null;

  // Packs
  const packErrors = [];
  const packsFull = [];
  for (const pid of profile.packIds) {
    const pack = lib.packById[pid];
    if (!pack) {
      packErrors.push({ type: "missing_pack", packId: pid });
      if (includeMissingRefs) {
        packsFull.push({
          packId: pid,
          name: `(Missing pack: ${pid})`,
          tags: [],
          abilities: [],
          missing: true,
        });
      }
      continue;
    }
    packsFull.push(pack);
  }

  const packAbilities = packsFull.flatMap((p) => safeArr(p.abilities));
  const uniqueAbilities = safeArr(profile.uniqueAbilities);

  const abilities = dedupeAbilities(
    [...packAbilities, ...uniqueAbilities].map(coerceAbility).filter(Boolean)
  );

  // Summary packs (for UI)
  const packs = packsFull.map((p) => ({
    packId: p.packId,
    name: p.name,
    tags: safeArr(p.tags),
    missing: !!p.missing,
  }));

  const errors = [];
  if (!world) {
    errors.push({ type: "missing_world", worldId: profile.worldId });
  }
  errors.push(...packErrors);

  return {
    ...profile,
    world,
    packs,
    abilities,
    diagnostics: {
      errors,
      counts: {
        packsRequested: profile.packIds.length,
        packsResolved: packsFull.filter((p) => !p.missing).length,
        abilitiesFromPacks: packAbilities.length,
        uniqueAbilities: uniqueAbilities.length,
        abilitiesTotal: abilities.length,
      },
      meta: lib.meta,
    },
  };
}

// -----------------------------
// Convenience: expand from an entity (archetype/luminary/shadow)
// -----------------------------
export function expandEntityMagic(entity, fallbackMagicProfile = null) {
  const e = safeObj(entity);
  const magic = e.magic || fallbackMagicProfile || makeMagicProfile();
  return expandMagicProfile(magic);
}
