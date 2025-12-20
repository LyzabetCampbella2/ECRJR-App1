// backend/scripts/buildCatalogs.seed.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT_LUM = path.join(__dirname, "..", "data", "luminary.catalog.json");
const OUT_SHA = path.join(__dirname, "..", "data", "shadow.catalog.json");

function ensureDir(p) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
}

function makeTags(anchor, secondary = []) {
  // secondary: [{ tag, w }]
  const tags = { [anchor]: 1 };
  for (const s of secondary) tags[s.tag] = s.w;
  return tags;
}

function L(id, name, anchor, secondary, overview, coreVirtue, shadowRisk, growthPrompt, shortLore, longLore) {
  return {
    id,
    name,
    family: "Luminary",
    tags: makeTags(anchor, secondary),
    overview,
    coreVirtue,
    shadowRisk,
    growthPrompt,
    lore: { short: shortLore, long: longLore }
  };
}

function S(id, name, anchor, secondary, overview, coreVirtue, shadowRisk, growthPrompt, shortLore, longLore) {
  return {
    id,
    name,
    family: "Shadow",
    tags: makeTags(anchor, secondary),
    overview,
    coreVirtue,
    shadowRisk,
    growthPrompt,
    lore: { short: shortLore, long: longLore }
  };
}

// ---------------------------
// 50 LUMINARIES (unique anchors)
// ---------------------------
const luminaries = [
  L(
    "LUM_BEACON",
    "The Beacon",
    "clarity",
    [{ tag: "truth", w: 0.7 }, { tag: "guidance", w: 0.5 }],
    "A steady light that reveals the path forward for others.",
    "Clarity",
    "Becoming distant, cold, or morally rigid.",
    "Where are you illuminating truth — and where are you blinding others with it?",
    "The Beacon does not move the sea — it simply shines.",
    "Those who walk as Beacons are not meant to command. Their duty is revelation: to show what is already real."
  ),
  L(
    "LUM_GUARDIAN",
    "The Guardian",
    "protection",
    [{ tag: "loyalty", w: 0.6 }, { tag: "oath", w: 0.4 }],
    "A sworn protector who stands between harm and the vulnerable.",
    "Devotion",
    "Overprotection that stifles growth.",
    "Who are you protecting — and who are you preventing from becoming strong?",
    "The Guardian does not seek glory — only duty.",
    "Guardians bind themselves to causes, people, or principles. Their test is knowing when to loosen their grip."
  ),
  L(
    "LUM_ARCHITECT",
    "The Architect",
    "structure",
    [{ tag: "discipline", w: 0.7 }, { tag: "strategy", w: 0.5 }],
    "A designer of systems, order, and long-term foundations.",
    "Structure",
    "Rigidity and emotional detachment.",
    "What are you building — and who must live inside it?",
    "Every lasting civilization begins with an Architect.",
    "Architects see patterns others miss. Their danger is forgetting that living things are not machines."
  ),
  L(
    "LUM_MENTOR",
    "The Mentor",
    "wisdom",
    [{ tag: "teaching", w: 0.7 }, { tag: "patience", w: 0.4 }],
    "A guide who shapes others through insight and restraint.",
    "Wisdom",
    "Withholding action in the name of guidance.",
    "When is it time to stop advising — and act?",
    "The Mentor teaches so they may one day be surpassed.",
    "True Mentors measure success by independence, not obedience."
  ),
  L(
    "LUM_SOVEREIGN",
    "The Sovereign",
    "stewardship",
    [{ tag: "responsibility", w: 0.6 }, { tag: "temperance", w: 0.4 }],
    "A bearer of responsibility whose choices shape many lives.",
    "Stewardship",
    "Control masquerading as leadership.",
    "Are you ruling for order — or for certainty?",
    "The crown is a burden before it is a privilege.",
    "Sovereigns exist to hold chaos at bay. Their failure comes when fear replaces responsibility."
  ),

  // --- Batch expansion (45 more) ---
  L("LUM_JUDGE", "The Judge", "judgment",
    [{ tag: "fairness", w: 0.6 }, { tag: "clarity", w: 0.3 }],
    "A calm arbiter who weighs truth with restraint.",
    "Justice",
    "Turning discernment into condemnation.",
    "Where are you judging to protect truth — and where are you punishing to soothe yourself?",
    "A verdict can be mercy when spoken without vanity.",
    "Judges do not exist to win. They exist to steady the scales when others would tip them."
  ),
  L("LUM_FORGE", "The Forge", "craft",
    [{ tag: "discipline", w: 0.6 }, { tag: "resilience", w: 0.4 }],
    "A maker who turns pressure into mastery.",
    "Craft",
    "Defining worth only through output.",
    "If you stopped producing, would you still feel valuable?",
    "Heat does not destroy — it reveals what’s true metal.",
    "The Forge refines by repetition. Its lesson is that mastery is devotion, not obsession."
  ),
  L("LUM_HEALER", "The Healer", "mercy",
    [{ tag: "restoration", w: 0.6 }, { tag: "presence", w: 0.4 }],
    "A restorer who brings people back to themselves.",
    "Mercy",
    "Taking on pain that isn’t yours to carry.",
    "What pain do you keep as proof you loved enough?",
    "Mercy is not softness — it is strength without cruelty.",
    "Healers mend what is torn, but must remember: compassion without boundaries becomes self-erasure."
  ),
  L("LUM_SENTINEL", "The Sentinel", "vigilance",
    [{ tag: "protection", w: 0.5 }, { tag: "discipline", w: 0.4 }],
    "A watcher who notices what everyone else misses.",
    "Vigilance",
    "Living in permanent readiness.",
    "What threat are you still preparing for that no longer exists?",
    "The Sentinel sleeps lightly so others may rest.",
    "Sentinels keep the line. Their growth is learning when the war is over."
  ),
  L("LUM_EMISSARY", "The Emissary", "diplomacy",
    [{ tag: "empathy", w: 0.6 }, { tag: "clarity", w: 0.3 }],
    "A bridge-builder who speaks between worlds.",
    "Diplomacy",
    "People-pleasing disguised as peacekeeping.",
    "Are you making peace — or avoiding conflict?",
    "Words can be treaties or weapons.",
    "Emissaries translate the unsaid. Their integrity is tested when both sides demand loyalty."
  ),
  L("LUM_LIBRARIAN", "The Librarian", "knowledge",
    [{ tag: "curiosity", w: 0.6 }, { tag: "wisdom", w: 0.4 }],
    "A collector of patterns, language, and meaning.",
    "Knowledge",
    "Hiding behind research instead of living.",
    "What do you study that you’re afraid to attempt?",
    "Ink remembers what panic forgets.",
    "Librarians catalog truth, but must not confuse understanding with intimacy."
  ),
  L("LUM_VANGUARD", "The Vanguard", "courage",
    [{ tag: "initiative", w: 0.6 }, { tag: "protection", w: 0.3 }],
    "A first-mover who steps forward when others freeze.",
    "Courage",
    "Charging ahead without listening.",
    "Where would restraint be braver than action?",
    "Someone must go first.",
    "Vanguards ignite motion. Their refinement is learning when to lead and when to follow."
  ),
  L("LUM_ORACLE", "The Oracle", "vision",
    [{ tag: "clarity", w: 0.5 }, { tag: "discernment", w: 0.4 }],
    "A seer of trajectories and consequences.",
    "Vision",
    "Becoming fatalistic or aloof.",
    "What future are you clinging to so tightly you can’t see the present?",
    "Prophecy is pattern-recognition, not destiny.",
    "Oracles perceive the arc — but must still choose tenderness in the moment."
  ),
  L("LUM_STEWARD", "The Steward", "service",
    [{ tag: "stewardship", w: 0.5 }, { tag: "humility", w: 0.4 }],
    "A keeper who maintains what others overlook.",
    "Service",
    "Resenting the unseen labor you provide.",
    "What do you need acknowledged — and why?",
    "Quiet work holds the world together.",
    "Stewards preserve continuity. Their task is to serve without self-abandonment."
  ),
  L("LUM_TEMPERER", "The Temperer", "balance",
    [{ tag: "temperance", w: 0.6 }, { tag: "clarity", w: 0.3 }],
    "A stabilizer who prevents extremes from swallowing the room.",
    "Balance",
    "Avoiding decisive choices.",
    "Where does your balance become indecision?",
    "Moderation is a blade with two edges.",
    "Temperers keep systems steady, but must remember: sometimes the moment demands a clear stance."
  )
];

// Auto-expand to 50 with refined but compact definitions
// You can edit names/anchors later; anchors must remain unique.
const lumSeeds = [
  ["LUM_CHRONICLER", "The Chronicler", "testimony", "truth", "legacy"],
  ["LUM_CUSTODIAN", "The Custodian", "caretaking", "service", "presence"],
  ["LUM_CARTOGRAPHER", "The Cartographer", "orientation", "vision", "clarity"],
  ["LUM_CONDUCTOR", "The Conductor", "coordination", "strategy", "service"],
  ["LUM_ALCHEMIST", "The Alchemist", "transmutation", "craft", "curiosity"],
  ["LUM_WARDEN", "The Warden", "containment", "protection", "discipline"],
  ["LUM_LAWGIVER", "The Lawgiver", "principle", "judgment", "temperance"],
  ["LUM_BASTION", "The Bastion", "fortitude", "resilience", "protection"],
  ["LUM_LIGHTBRINGER", "The Lightbringer", "hope", "guidance", "mercy"],
  ["LUM_ASTRONOMER", "The Astronomer", "perspective", "knowledge", "vision"],
  ["LUM_CHAMPION", "The Champion", "valor", "courage", "loyalty"],
  ["LUM_SCRIBE", "The Scribe", "precision", "knowledge", "discipline"],
  ["LUM_WEAVER", "The Weaver", "cohesion", "diplomacy", "empathy"],
  ["LUM_PILLAR", "The Pillar", "steadfastness", "balance", "fortitude"],
  ["LUM_PHOENIX", "The Phoenix", "renewal", "resilience", "hope"],
  ["LUM_GARDENER", "The Gardener", "nurture", "mercy", "patience"],
  ["LUM_ARTISAN", "The Artisan", "mastery", "craft", "discipline"],
  ["LUM_ARBITER", "The Arbiter", "equity", "judgment", "clarity"],
  ["LUM_PILGRIM", "The Pilgrim", "devotion", "service", "wisdom"],
  ["LUM_HERALD", "The Herald", "revelation", "truth", "guidance"],
  ["LUM_NAVIGATOR", "The Navigator", "direction", "orientation", "strategy"],
  ["LUM_MEDIATOR", "The Mediator", "reconciliation", "diplomacy", "balance"],
  ["LUM_TUTOR", "The Tutor", "instruction", "teaching", "patience"],
  ["LUM_SAFEGUARD", "The Safeguard", "sanctuary", "protection", "mercy"],
  ["LUM_QUILL", "The Quill", "articulation", "knowledge", "clarity"],
  ["LUM_WAYFINDER", "The Wayfinder", "pathfinding", "direction", "vision"],
  ["LUM_FOUNDER", "The Founder", "foundation", "structure", "stewardship"],
  ["LUM_MAGISTRATE", "The Magistrate", "order", "principle", "judgment"],
  ["LUM_HARBORMASTER", "The Harbormaster", "stability", "balance", "service"],
  ["LUM_VIGIL", "The Vigil", "alertness", "vigilance", "protection"],
  ["LUM_LANTERN", "The Lantern", "illumination", "clarity", "hope"],
  ["LUM_RESOLUTE", "The Resolute", "resolve", "fortitude", "stewardship"],
  ["LUM_BENEFACTOR", "The Benefactor", "generosity", "mercy", "service"],
  ["LUM_COUNCILOR", "The Councilor", "deliberation", "wisdom", "temperance"],
  ["LUM_COMMANDER", "The Commander", "command", "strategy", "courage"],
  ["LUM_EMPATH", "The Empath", "empathy", "mercy", "presence"],
  ["LUM_WITNESS", "The Witness", "witness", "testimony", "truth"],
  ["LUM_RECTOR", "The Rector", "guidance", "teaching", "principle"],
  ["LUM_CRAFTER", "The Crafter", "ingenuity", "craft", "curiosity"],
  ["LUM_SENTENCE", "The Sentence", "verdict", "judgment", "clarity"]
];

while (luminaries.length < 50) {
  const [id, name, anchor, s1, s2] = lumSeeds[luminaries.length - 10] || lumSeeds[0];
  luminaries.push(
    L(
      id,
      name,
      anchor,
      [{ tag: s1, w: 0.6 }, { tag: s2, w: 0.4 }],
      `A refined force defined by ${anchor}.`,
      anchor[0].toUpperCase() + anchor.slice(1),
      `When distorted, ${anchor} becomes excess.`,
      `How can you practice ${anchor} without losing softness?`,
      `${name} holds a quiet principle like a sealed letter.`,
      `In the Eirden canon, ${name} is tested not by power, but by how gracefully they carry responsibility.`
    )
  );
}

// ---------------------------
// 50 SHADOWS (unique anchors)
// ---------------------------
const shadows = [
  S(
    "SHA_TYRANT",
    "The Tyrant",
    "domination",
    [{ tag: "control", w: 0.7 }, { tag: "pride", w: 0.5 }],
    "A force that seeks certainty through control.",
    "Power (distorted)",
    "Collapse when control fails.",
    "What are you afraid would happen if you let go?",
    "The Tyrant rules to silence fear.",
    "Tyrants are born from terror of disorder. Their tragedy is believing control equals safety."
  ),
  S(
    "SHA_MARTYR",
    "The Martyr",
    "self_sacrifice",
    [{ tag: "resentment", w: 0.6 }, { tag: "suppression", w: 0.4 }],
    "One who erases themselves to be needed.",
    "Endurance (misapplied)",
    "Quiet bitterness and emotional debt.",
    "What do you gain by being indispensable?",
    "The Martyr bleeds so others may stay comfortable.",
    "Martyrs call suffering noble until resentment poisons everything they touch."
  ),
  S(
    "SHA_VOID",
    "The Voidwalker",
    "detachment",
    [{ tag: "avoidance", w: 0.7 }, { tag: "isolation", w: 0.5 }],
    "An escape into absence when pain feels inevitable.",
    "Distance",
    "Emotional disappearance.",
    "What are you refusing to feel?",
    "The Voidwalker survives by vanishing.",
    "Detachment protects — until it becomes erasure. Voidwalkers must relearn presence."
  ),
  S(
    "SHA_PERFECTION_CAGE",
    "The Perfection Cage",
    "perfectionism",
    [{ tag: "rigidity", w: 0.6 }, { tag: "anxiety", w: 0.4 }],
    "A prison built from impossible standards.",
    "Excellence (corrupted)",
    "Paralysis and self-hatred.",
    "Who taught you that mistakes are unsafe?",
    "The cage is invisible — until you try to move.",
    "Perfectionism is fear dressed as discipline. Freedom begins with imperfection."
  ),
  S(
    "SHA_MANIPULATOR",
    "The Manipulator",
    "manipulation",
    [{ tag: "deception", w: 0.6 }, { tag: "vanity", w: 0.4 }],
    "A strategist who avoids vulnerability through control.",
    "Insight (weaponized)",
    "Isolation and mistrust.",
    "What would honesty cost you?",
    "The Manipulator never plays fair — even with themselves.",
    "Manipulators fear rejection more than loneliness. Truth is their greatest risk."
  )
];

const shaSeeds = [
  ["SHA_USURPER", "The Usurper", "entitlement", "envy", "pride"],
  ["SHA_PREDATOR", "The Predator", "exploitation", "domination", "deception"],
  ["SHA_FAWN", "The Fawn", "appeasement", "fear", "suppression"],
  ["SHA_PARANOID", "The Paranoid", "paranoia", "vigilance", "anxiety"],
  ["SHA_RUMINATOR", "The Ruminator", "rumination", "shame", "anxiety"],
  ["SHA_SCORCH", "The Scorched", "burnout", "avoidance", "collapse"],
  ["SHA_GHAST", "The Ghast", "despair", "isolation", "shame"],
  ["SHA_GLUTTON", "The Glutton", "excess", "hunger", "avoidance"],
  ["SHA_HOARDER", "The Hoarder", "greed", "control", "fear"],
  ["SHA_SABOTEUR", "The Saboteur", "self_sabotage", "shame", "avoidance"],
  ["SHA_NEEDLE", "The Needle", "criticism", "rigidity", "pride"],
  ["SHA_VEIL", "The Veil", "secrecy", "deception", "detachment"],
  ["SHA_TEMPEST", "The Tempest", "wrath", "domination", "pride"],
  ["SHA_SIREN", "The Siren", "seduction", "vanity", "manipulation"],
  ["SHA_WRAITH", "The Wraith", "numbness", "detachment", "despair"],
  ["SHA_JUDGELOCK", "The Judgelock", "condemnation", "criticism", "rigidity"],
  ["SHA_PUPPETEER", "The Puppeteer", "coercion", "manipulation", "control"],
  ["SHA_MISER", "The Miser", "scarcity", "greed", "fear"],
  ["SHA_IMPOSTOR", "The Impostor", "fraud", "shame", "paranoia"],
  ["SHA_ORACLESCAR", "The Oracle-Scar", "fatalism", "despair", "rumination"],
  ["SHA_HOLLOWCROWN", "The Hollow Crown", "insecurity", "vanity", "control"],
  ["SHA_BLOODDEBT", "The Blood-Debt", "vengeance", "wrath", "rumination"],
  ["SHA_GLASSHEART", "The Glassheart", "fragility", "fear", "avoidance"],
  ["SHA_THORN", "The Thorn", "spite", "criticism", "wrath"],
  ["SHA_SILT", "The Silt", "stagnation", "avoidance", "despair"],
  ["SHA_SPECTATOR", "The Spectator", "passivity", "detachment", "avoidance"],
  ["SHA_WARD", "The Ward", "dependency", "appeasement", "fear"],
  ["SHA_TANGLE", "The Tangle", "confusion", "rumination", "anxiety"],
  ["SHA_GUILTCHAIN", "The Guilt-Chain", "guilt", "self_sacrifice", "shame"],
  ["SHA_BLADEGRIN", "The Bladegrin", "cruelty", "wrath", "pride"],
  ["SHA_MIRROR", "The Mirror", "comparison", "envy", "vanity"],
  ["SHA_BROKENVOW", "The Broken Vow", "betrayal", "secrecy", "resentment"],
  ["SHA_GRIP", "The Grip", "clinging", "control", "fear"],
  ["SHA_COLDREAD", "The Coldread", "calculation", "manipulation", "detachment"],
  ["SHA_STAIN", "The Stain", "shame", "rumination", "despair"],
  ["SHA_LATCH", "The Latch", "avoidance", "secrecy", "fear"],
  ["SHA_DEBTOR", "The Debtor", "obligation", "self_sacrifice", "resentment"],
  ["SHA_HUNGER", "The Hunger", "insatiability", "excess", "greed"],
  ["SHA_ASHES", "The Ashes", "collapse", "burnout", "despair"],
  ["SHA_RAZOR", "The Razor", "harshness", "criticism", "wrath"],
  ["SHA_GILDED", "The Gilded", "vanity", "comparison", "entitlement"],
  ["SHA_LOCKJAW", "The Lockjaw", "silence", "secrecy", "suppression"],
  ["SHA_TREMOR", "The Tremor", "panic", "anxiety", "paranoia"],
  ["SHA_TIDE", "The Undertow", "pull", "control", "avoidance"]
];

while (shadows.length < 50) {
  const [id, name, anchor, s1, s2] = shaSeeds[shadows.length - 5] || shaSeeds[0];
  shadows.push(
    S(
      id,
      name,
      anchor,
      [{ tag: s1, w: 0.6 }, { tag: s2, w: 0.4 }],
      `A shadow-pattern defined by ${anchor}.`,
      `${anchor} (distorted)`,
      `When intensified, ${anchor} consumes choice.`,
      `What truth would soften ${anchor} without shattering you?`,
      `${name} arrives quietly, like ink spreading in water.`,
      `In the Eirden canon, ${name} is not “evil” — it is a survival strategy that outlived its moment.`
    )
  );
}

// Write files
ensureDir(OUT_LUM);
ensureDir(OUT_SHA);

fs.writeFileSync(OUT_LUM, JSON.stringify(luminaries, null, 2), "utf-8");
fs.writeFileSync(OUT_SHA, JSON.stringify(shadows, null, 2), "utf-8");

console.log("✅ Wrote catalogs:");
console.log(" -", OUT_LUM);
console.log(" -", OUT_SHA);
console.log("Luminaries:", luminaries.length, "Shadows:", shadows.length);
