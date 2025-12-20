/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

// ---------------------------
// Refined virtue + role lexicon
// (30 x 30 = 900)
// ---------------------------
const VIRTUES = [
  "Resonant","Poised","Luminous","Tempered","Verdant","Oxblood","Ivory","Gilded","Regal","Quiet",
  "Exacting","Incisive","Devotional","Ceremonial","Rarefied","Polished","Austere","Serene","Resolute","Subtle",
  "Sovereign","Arcane","Braided","Eloquent","Measured","Gravitas","Chiseled","Velvet","Obsidian","Celestial"
];

const ROLES = [
  "Artisan","Curator","Archivist","Cartographer","Architect","Alchemist","Composer","Illuminator","Chronicler","Scholar",
  "Scribe","Examiner","Conservator","Orator","Diplomat","Steward","Sentinel","Cipher","Weaver","Sculptor",
  "Maker","Forger","Navigator","Theorist","Ethnographer","Pedagogue","Psychologist","Sociologist","Anthropologist","Semiotician"
];

// Facet titles (refined)
const FACETS = {
  Luminary: ["Crowned", "Clarified", "Harmonized", "Ascendant"],
  Shadow: ["Veiled", "Fractured", "Hollowed", "Unbound"],
  Balanced: ["Clear", "Steady", "Composed", "Aligned"]
};

// ---------------------------
// Role -> domain tags & focus
// (includes psych/anthro/soc/pedagogy)
// ---------------------------
const ROLE_META = {
  Psychologist:   { tags: ["psychology","inner-life","cognition","emotion"], focus: "Psych & Self" },
  Anthropologist:{ tags: ["anthropology","ritual","identity","culture"], focus: "Anthro & Identity" },
  Sociologist:   { tags: ["sociology","community","norms","audience"], focus: "Society & Audience" },
  Pedagogue:     { tags: ["pedagogy","learning","practice","feedback"], focus: "Learning & Growth" },
  Ethnographer:  { tags: ["anthropology","field-notes","observation","culture"], focus: "Cultural Observation" },
  Semiotician:   { tags: ["semiotics","symbolism","metaphor","meaning"], focus: "Symbols & Meaning" },
  Conservator:   { tags: ["craft","technique","materials","quality"], focus: "Craft & Care" },
  Architect:     { tags: ["structure","systems","composition","planning"], focus: "Structure & Systems" },
  Cartographer:  { tags: ["mapping","patterns","context","exploration"], focus: "Patterns & Context" },
  Curator:       { tags: ["taste","selection","meaning","cohesion"], focus: "Curation & Cohesion" },
  Archivist:     { tags: ["memory","history","cataloging","method"], focus: "Archive & Method" },
  Alchemist:     { tags: ["emotion","transformation","alchemy","depth"], focus: "Emotion & Change" },
  Scholar:       { tags: ["research","theory","analysis","study"], focus: "Research & Theory" },
  Examiner:      { tags: ["assessment","precision","standards","review"], focus: "Assessment & Precision" },
  Diplomat:      { tags: ["communication","audience","social","bridging"], focus: "Social Translation" }
};

function pickFacetTitle(idNum, facet) {
  const arr = FACETS[facet] || FACETS.Balanced;
  return arr[idNum % arr.length];
}

function makeSummary(virtue, role, focus) {
  // short, refined, repeatable, non-cringe
  return `You create with a ${virtue.toLowerCase()} sensibility: ${role.toLowerCase()} energy oriented toward ${focus.toLowerCase()}. You value clarity, coherence, and intentional craft.`;
}

function makeStrengths(role) {
  // role-driven strengths (kept elegant)
  const map = {
    Psychologist: ["Emotional insight","Pattern recognition","Inner honesty"],
    Anthropologist: ["Cultural sensitivity","Ritual awareness","Identity depth"],
    Sociologist: ["Social intuition","Community literacy","Context reading"],
    Pedagogue: ["Deliberate practice","Skill scaffolding","Feedback integration"],
    Ethnographer: ["Observation","Detail capture","Context fidelity"],
    Semiotician: ["Meaning design","Metaphor fluency","Symbol layering"],
    Conservator: ["Craft precision","Material care","Quality control"],
    Architect: ["Structure","Systems thinking","Intentional composition"],
    Cartographer: ["Mapping patterns","Exploration","Context synthesis"],
    Curator: ["Taste","Cohesion","Editorial clarity"],
    Archivist: ["Method","Memory systems","Documentation"],
    Alchemist: ["Transformation","Emotional range","Depth work"],
    Scholar: ["Research discipline","Theory building","Analytical clarity"],
    Examiner: ["Precision","Standards","Clear evaluation"],
    Diplomat: ["Translation","Audience empathy","Bridge-building"]
  };
  return map[role] || ["Intentional craft","Refinement","Consistency"];
}

function makeEdges(role) {
  // growth edges (refined phrasing)
  const map = {
    Psychologist: ["Over-identifying with feeling","Intensity fatigue"],
    Anthropologist: ["Distance from spontaneity","Over-contextualizing"],
    Sociologist: ["People-pleasing drift","Over-reading reception"],
    Pedagogue: ["Over-structuring early drafts","Delayed play"],
    Ethnographer: ["Analysis before expression","Hesitation to commit"],
    Semiotician: ["Over-intellectualizing","Perfection delay"],
    Conservator: ["Caution over experimentation","Polish loop"],
    Architect: ["Rigidity under pressure","Over-planning"],
    Cartographer: ["Wandering scope","Too many pathways"],
    Curator: ["Second-guessing choices","Over-editing"],
    Archivist: ["Storing over shipping","Too much cataloging"],
    Alchemist: ["Emotional overexposure","Intensity swings"],
    Scholar: ["Theory over output","Slower completion"],
    Examiner: ["Harsh self-critique","Narrow standards"],
    Diplomat: ["Softening the message","Avoiding sharp decisions"]
  };
  return map[role] || ["Over-refining","Delayed completion"];
}

function makeTags(virtue, role) {
  const base = ["refined","sophisticated","dark-academia"];
  const meta = ROLE_META[role];
  const roleTags = meta?.tags || [];
  // virtue tags (use color vibes sparingly)
  const virtueTags = [];
  if (["Verdant"].includes(virtue)) virtueTags.push("verdant");
  if (["Oxblood"].includes(virtue)) virtueTags.push("oxblood");
  if (["Ivory"].includes(virtue)) virtueTags.push("ivory");
  if (["Gilded"].includes(virtue)) virtueTags.push("gilded");
  if (["Obsidian"].includes(virtue)) virtueTags.push("obsidian");
  return Array.from(new Set([...base, ...virtueTags, ...roleTags]));
}

function main() {
  const outDir = path.join(__dirname, "..", "data", "archetypes");
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, "main_v1.archetypes.json");

  const archetypes = [];
  let idNum = 1;

  // Generate 30 x 30 = 900
  for (const virtue of VIRTUES) {
    for (const role of ROLES) {
      const id = `M${String(idNum).padStart(3, "0")}`; // Main test: M001..M900
      const name = `The ${virtue} ${role}`;

      // We store facet titles; actual facet is assigned later by results logic
      const facetTitles = {
        Luminary: pickFacetTitle(idNum, "Luminary"),
        Shadow: pickFacetTitle(idNum, "Shadow"),
        Balanced: pickFacetTitle(idNum, "Balanced")
      };

      const meta = ROLE_META[role] || { focus: "Art & Identity" };
      const summary = makeSummary(virtue, role, meta.focus || "Art & Identity");

      archetypes.push({
        id,
        name,
        facetTitles,
        tags: makeTags(virtue, role),
        focus: meta.focus || "Art & Identity",
        summary,
        strengths: makeStrengths(role),
        growthEdges: makeEdges(role)
      });

      idNum++;
    }
  }

  // Safety check
  if (archetypes.length !== 900) {
    throw new Error(`Expected 900 archetypes, got ${archetypes.length}`);
  }

  fs.writeFileSync(outPath, JSON.stringify(archetypes, null, 2), "utf-8");
  console.log(`✅ Wrote ${archetypes.length} archetypes -> ${outPath}`);
}

main();
