// backend/data/magic/defaultMagicProfile.v1.js
/**
 * Default Magic Profile (v1)
 * --------------------------
 * Used whenever an archetype/luminary/shadow doesn't yet define `magic`.
 *
 * You can change the defaults here anytime without breaking the system.
 * Just ensure the worldId exists in:
 *   backend/data/magic/worlds.v1.json
 * and the packIds exist in:
 *   backend/data/magic/abilityPacks.v1.json
 */

import { makeMagicProfile } from "../../lib/magicEngine.js";

export const DEFAULT_MAGIC_PROFILE_V1 = makeMagicProfile({
  // Pick one of your existing worlds
  worldId: "world_01_elyndra",

  // The "method" of magic (pure flavor for now — used by UI / lore / filtering later)
  school: "Sigilcraft",

  // Archetypal flavors (used for sorting + lore; not required by engine)
  aspects: ["Star", "Veil"],

  // Ability packs (each pack can contribute up to 20 abilities)
  // Change this to: ["pack_commander_01"] or ["pack_trickster_01"] etc if desired.
  packIds: ["pack_mystic_01"],

  // Optional (0–5) unique ability objects:
  // { id, name, type, cost, cooldown, effect, counter }
  uniqueAbilities: [],
});
