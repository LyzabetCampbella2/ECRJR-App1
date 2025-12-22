// backend/lib/magicAutoAssign.js
/**
 * Auto Magic Assignment (v1)
 * --------------------------
 * Deterministically assigns magic to any tag if no manual assignment exists.
 *
 * Strategy:
 * - Keyword match on tag (or name later)
 * - Stable hash fallback to pick a world + pack
 */

import { makeMagicProfile, loadMagicLibrary } from "./magicEngine.js";

function stableHashToInt(input) {
  const str = String(input ?? "");
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pickFrom(arr, seed) {
  const a = Array.isArray(arr) ? arr : [];
  if (!a.length) return null;
  return a[seed % a.length];
}

function norm(s) {
  return String(s || "").toLowerCase();
}

/**
 * Keyword rules -> pack/world/school/aspects
 * Extend this over time.
 */
const RULES = [
  {
    match: ["mystic", "oracle", "seer", "sage", "prophet", "vision"],
    packId: "pack_mystic_01",
    preferredWorlds: ["world_03_miridell", "world_01_elyndra", "world_07_frostvein"],
    school: "Sigilcraft",
    aspects: ["Star", "Veil"]
  },
  {
    match: ["commander", "general", "marshal", "captain", "warlord", "leader"],
    packId: "pack_commander_01",
    preferredWorlds: ["world_05_aerovale", "world_02_vyreholm", "world_01_elyndra"],
    school: "Oathcraft",
    aspects: ["Banner", "Storm"]
  },
  {
    match: ["trickster", "thief", "deceiver", "jester", "spy", "shadow", "mask"],
    packId: "pack_trickster_01",
    preferredWorlds: ["world_06_noxmere", "world_03_miridell", "world_01_elyndra"],
    school: "Illusionweave",
    aspects: ["Smoke", "Mirror"]
  },
  {
    match: ["craft", "smith", "maker", "artisan", "builder", "architect", "forge", "rune"],
    packId: "pack_craftsman_01",
    preferredWorlds: ["world_02_vyreholm", "world_04_caerth", "world_07_frostvein"],
    school: "Runeforge",
    aspects: ["Forge", "Rune"]
  }
];

export function autoAssignMagicForTag(tag, kind = "archetype") {
  const t = norm(tag);
  const seed = stableHashToInt(`${kind}:${t}`);

  // Try rule match
  for (const r of RULES) {
    if (r.match.some((kw) => t.includes(kw))) {
      const worldId = pickFrom(r.preferredWorlds, seed) || "world_01_elyndra";
      return makeMagicProfile({
        worldId,
        school: r.school,
        aspects: r.aspects,
        packIds: [r.packId],
        uniqueAbilities: []
      });
    }
  }

  // Fallback: pick deterministically from available worlds/packs
  const lib = loadMagicLibrary();
  const world = pickFrom(lib.worlds.map((w) => w.worldId), seed) || "world_01_elyndra";
  const pack = pickFrom(lib.packs.map((p) => p.packId), seed) || "pack_mystic_01";

  // School/aspects default by pack
  const byPack = {
    pack_mystic_01: { school: "Sigilcraft", aspects: ["Star", "Veil"] },
    pack_commander_01: { school: "Oathcraft", aspects: ["Banner", "Storm"] },
    pack_trickster_01: { school: "Illusionweave", aspects: ["Smoke", "Mirror"] },
    pack_craftsman_01: { school: "Runeforge", aspects: ["Forge", "Rune"] }
  };

  const flavor = byPack[pack] || { school: "Sigilcraft", aspects: ["Star", "Veil"] };

  return makeMagicProfile({
    worldId: world,
    school: flavor.school,
    aspects: flavor.aspects,
    packIds: [pack],
    uniqueAbilities: []
  });
}
