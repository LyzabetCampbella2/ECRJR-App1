// backend/controllers/magicController.js
import { loadMagicLibrary, expandMagicProfile } from "../lib/magicEngine.js";

function toBool(v) {
  if (v === true || v === false) return v;
  const s = String(v ?? "").toLowerCase().trim();
  return s === "1" || s === "true" || s === "yes" || s === "y";
}

function pickPackSummary(pack) {
  return {
    packId: pack.packId,
    name: pack.name,
    tags: pack.tags || [],
    // abilityCount is safe to show always
    abilityCount: Array.isArray(pack.abilities) ? pack.abilities.length : 0,
  };
}

export async function getMagicLibrary(req, res) {
  try {
    const includeAbilities = toBool(req.query.includeAbilities);
    const forceReload = toBool(req.query.forceReload);

    const lib = loadMagicLibrary({ forceReload });

    const packs = includeAbilities
      ? lib.packs // full packs include abilities (already normalized in magicEngine)
      : lib.packs.map(pickPackSummary);

    return res.json({
      ok: true,
      meta: lib.meta,
      worlds: lib.worlds,
      packs,
    });
  } catch (err) {
    console.error("getMagicLibrary error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error loading magic library",
    });
  }
}

export async function getMagicWorlds(req, res) {
  try {
    const forceReload = toBool(req.query.forceReload);
    const lib = loadMagicLibrary({ forceReload });

    return res.json({
      ok: true,
      meta: lib.meta,
      worlds: lib.worlds,
    });
  } catch (err) {
    console.error("getMagicWorlds error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error loading magic worlds",
    });
  }
}

export async function getMagicPacks(req, res) {
  try {
    const includeAbilities = toBool(req.query.includeAbilities);
    const forceReload = toBool(req.query.forceReload);

    const lib = loadMagicLibrary({ forceReload });

    const packs = includeAbilities
      ? lib.packs
      : lib.packs.map(pickPackSummary);

    return res.json({
      ok: true,
      meta: lib.meta,
      packs,
    });
  } catch (err) {
    console.error("getMagicPacks error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error loading magic packs",
    });
  }
}

/**
 * POST /api/magic/expand
 * Body: { magic: { worldId, school, aspects, packIds, uniqueAbilities } }
 * Returns expanded magic with 20 abilities (from pack) + unique abilities
 */
export async function expandMagic(req, res) {
  try {
    const magic = req.body?.magic || req.body || {};
    const expanded = expandMagicProfile(magic);

    return res.json({
      ok: true,
      expanded,
    });
  } catch (err) {
    console.error("expandMagic error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error expanding magic profile",
    });
  }
}
