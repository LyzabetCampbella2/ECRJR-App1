// backend/lib/constellationLibrary.js
/**
 * Simple starter library (expand anytime).
 * Each constellation has a Luminary and Shadow aspect.
 */

export const CONSTELLATION_LIBRARY = {
  C01: {
    name: "The Keystone",
    luminary: { id: "L_C01", name: "The Arbiter", gift: "truth with clean boundaries" },
    shadow: { id: "S_C01", name: "The Accuser", snag: "suspicion that hardens into punishment" },
  },
  C02: {
    name: "The Anvil",
    luminary: { id: "L_C02", name: "The Crafter", gift: "discipline, repetition, mastery" },
    shadow: { id: "S_C02", name: "The Overworker", snag: "worth measured only by output" },
  },
  C03: {
    name: "The Hearthline",
    luminary: { id: "L_C03", name: "The Steward", gift: "care that stabilizes others" },
    shadow: { id: "S_C03", name: "The Martyr", snag: "self-erasure disguised as devotion" },
  },
  C04: {
    name: "The Covenant",
    luminary: { id: "L_C04", name: "The Warden", gift: "standards that protect what matters" },
    shadow: { id: "S_C04", name: "The Prosecutor", snag: "rigidity that becomes contempt" },
  },
  C05: {
    name: "The Bright Edge",
    luminary: { id: "L_C05", name: "The Clarifier", gift: "directness that liberates" },
    shadow: { id: "S_C05", name: "The Scorcher", snag: "truth used as a blade" },
  },
  C06: {
    name: "The Veil",
    luminary: { id: "L_C06", name: "The Seer", gift: "pattern-sense, subtle perception" },
    shadow: { id: "S_C06", name: "The Phantom", snag: "distance that becomes disappearance" },
  },
  C07: {
    name: "The Circle",
    luminary: { id: "L_C07", name: "The Loyalist", gift: "belonging that endures" },
    shadow: { id: "S_C07", name: "The Pleaser", snag: "peacekeeping at the cost of self" },
  },
  C08: {
    name: "The Rift",
    luminary: { id: "L_C08", name: "The Catalyst", gift: "movement, courage, rupture-as-renewal" },
    shadow: { id: "S_C08", name: "The Saboteur", snag: "burning everything to feel control" },
  },
  C09: {
    name: "The Quiet Gate",
    luminary: { id: "L_C09", name: "The Guardian", gift: "privacy, sovereignty, discernment" },
    shadow: { id: "S_C09", name: "The Exile", snag: "withholding that becomes loneliness" },
  },
  C10: {
    name: "The Star-Vector",
    luminary: { id: "L_C10", name: "The Pathfinder", gift: "vision with direction" },
    shadow: { id: "S_C10", name: "The Pusher", snag: "momentum that tramples nuance" },
  },
  C11: {
    name: "The Orchard",
    luminary: { id: "L_C11", name: "The Keeper", gift: "steadiness, home, containment" },
    shadow: { id: "S_C11", name: "The Clinger", snag: "fear of change disguised as safety" },
  },
  C12: {
    name: "The Atelier",
    luminary: { id: "L_C12", name: "The Curator", gift: "refinement, editing, sophisticated taste" },
    shadow: { id: "S_C12", name: "The Critic", snag: "standards used to shame the unfinished" },
  },
  C13: {
    name: "The Lattice",
    luminary: { id: "L_C13", name: "The Architect", gift: "systems thinking, clean structure" },
    shadow: { id: "S_C13", name: "The Controller", snag: "control that strangles collaboration" },
  },
  C14: {
    name: "The Blade-Rule",
    luminary: { id: "L_C14", name: "The Master", gift: "precision, mastery, practiced excellence" },
    shadow: { id: "S_C14", name: "The Perfectionist", snag: "never-finished, never-enough" },
  },
  C15: {
    name: "The Mythwell",
    luminary: { id: "L_C15", name: "The Storyweaver", gift: "meaning, symbol, narrative power" },
    shadow: { id: "S_C15", name: "The Escapist", snag: "story used to avoid reality" },
  },
  C16: {
    name: "The Halo",
    luminary: { id: "L_C16", name: "The Luminous", gift: "presence, clarity, light-making" },
    shadow: { id: "S_C16", name: "The Dazzler", snag: "surface brightness masking depletion" },
  },
};

export function getConstellationEntry(id) {
  return CONSTELLATION_LIBRARY[id] || null;
}
