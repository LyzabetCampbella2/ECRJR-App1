// backend/lib/magicAssignments.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { makeMagicProfile } from "./magicEngine.js";
import { autoAssignMagicForTag } from "./magicAutoAssign.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARCH_PATH = path.join(__dirname, "..", "data", "magic", "assignments.archetypes.v1.json");
const LUMI_PATH = path.join(__dirname, "..", "data", "magic", "assignments.luminaries.v1.json");
const SHAD_PATH = path.join(__dirname, "..", "data", "magic", "assignments.shadows.v1.json");

function readJsonSafe(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

let CACHE = null;

export function loadMagicAssignments({ forceReload = false } = {}) {
  if (CACHE && !forceReload) return CACHE;

  const arch = readJsonSafe(ARCH_PATH, { byArchetypeTag: {}, fallback: {} });
  const lumi = readJsonSafe(LUMI_PATH, { byLuminaryTag: {}, fallback: {} });
  const shad = readJsonSafe(SHAD_PATH, { byShadowTag: {}, fallback: {} });

  CACHE = { arch, lumi, shad };
  return CACHE;
}

export function resolveArchetypeMagic(tag) {
  const { arch } = loadMagicAssignments();
  const hit = arch?.byArchetypeTag?.[tag];
  if (hit) return makeMagicProfile(hit);

  // manual fallback if provided
  if (arch?.fallback && Object.keys(arch.fallback).length) {
    return makeMagicProfile(arch.fallback);
  }

  // auto fallback (deterministic)
  return autoAssignMagicForTag(tag, "archetype");
}

export function resolveLuminaryMagic(tag) {
  const { lumi } = loadMagicAssignments();
  const hit = lumi?.byLuminaryTag?.[tag];
  if (hit) return makeMagicProfile(hit);

  if (lumi?.fallback && Object.keys(lumi.fallback).length) {
    return makeMagicProfile(lumi.fallback);
  }

  return autoAssignMagicForTag(tag, "luminary");
}

export function resolveShadowMagic(tag) {
  const { shad } = loadMagicAssignments();
  const hit = shad?.byShadowTag?.[tag];
  if (hit) return makeMagicProfile(hit);

  if (shad?.fallback && Object.keys(shad.fallback).length) {
    return makeMagicProfile(shad.fallback);
  }

  return autoAssignMagicForTag(tag, "shadow");
}
