/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

/**
 * Generates 900 refined/sophisticated archetypes.
 * Output:
 *   backend/data/archetypes/main_v1.archetypes.json
 *
 * Notes:
 * - No code changes required later. Regenerate file anytime.
 * - IDs: M001..M900
 */

function pad3(n) {
  return String(n).padStart(3, "0");
}

function pick(arr, i) {
  return arr[i % arr.length];
}

function makeName(role, house, epithet) {
  // Refined naming: "The Verdant Architect", "The Luminous Curator", etc.
  return `The ${epithet} ${role} of ${house}`;
}

function makeFacetTitles(role) {
  return {
    Luminary: `Crowned ${role}`,
    Shadow: `Veiled ${role}`,
    Balanced: `Clear ${role}`
  };
}

function main() {
  const roles = [
    "Architect", "Curator", "Orator", "Cartographer", "Alchemist",
    "Scribe", "Composer", "Choreographer", "Illuminator", "Restorer",
    "Conservator", "Draughtsman", "Weaver", "Porter", "Custodian",
    "Envoy", "Mediator", "Herald", "Metallurgist", "Mariner",
    "Botanist", "Astronomer", "Librarian", "Artisan", "Conductor"
  ];

  const houses = [
    "Eirden", "Aurelian", "Vesper", "Ivory Hall", "Verdant Court",
    "Oxblood Atelier", "Sable Archive", "Crown & Quill", "Glass Meridian",
    "Blue Reliquary", "Crimson Conservatory", "Silent Symposium"
  ];

  const epithets = [
    "Verdant", "Luminous", "Sable", "Aurelian", "Ivory",
    "Vesper", "Crimson", "Azure", "Oxblood", "Umbral",
    "Pearled", "Gilded", "Cobalt", "Juniper", "Marbled",
    "Obsidian", "Silvered", "Laurel", "Beryl", "Cerulean",
    "Ebon", "Rosewood", "Indigo", "Alabaster"
  ];

  const focuses = [
    "Systems, structure, and meaning through disciplined craft.",
    "Taste, selection, and refined emotional impact.",
    "Translation of feeling into coherent form.",
    "Conceptual rigor with an aesthetic spine.",
    "Atmosphere, narrative, and symbolic clarity.",
    "Technical mastery in service of vision.",
    "Community resonance and cultural context.",
    "Pedagogy: learning, iteration, and deliberate practice.",
    "Psychology: emotion, identity, and self-integration.",
    "Anthropology: ritual, pattern, and human meaning-making."
  ];

  const tags = [
    "structured", "craft", "conceptual", "symbolic", "editorial",
    "emotion", "discipline", "experiment", "taste", "narrative",
    "pedagogy", "psychology", "anthropology", "sociology", "technique"
  ];

  const strengthPhrases = [
    "Strategic maker", "Refined taste", "Clear visual logic", "High follow-through",
    "Atmosphere control", "Conceptual rigor", "Emotional intelligence", "Symbolic clarity",
    "Deliberate practice", "Adaptive experimentation"
  ];

  const growthEdges = [
    "Over-control", "Perfection loops", "Delayed publishing", "Rigid self-standards",
    "Avoiding messiness", "Overthinking meaning", "Under-sharing work", "Creative isolation",
    "Burnout cycles", "Fear of critique"
  ];

  const loreShortTemplates = [
    "A refined builder of worlds—your hands translate vision into enduring form.",
    "A sophisticated selector—your art is built from exquisite decisions.",
    "A quiet conductor of atmosphere—your work makes rooms feel different.",
    "A disciplined visionary—your imagination prefers structure, not chaos.",
    "A translator of the inner life—your craft gives emotion a dignified shape."
  ];

  const loreLongTemplates = [
    "You are drawn to elegant structure: the hidden grid beneath beauty. When aligned, you build steadily and leave a signature of coherence. When strained, you may tighten the frame until the work can’t breathe—your path is learning when to loosen without losing integrity.",
    "You understand the weight of a single choice. Your gift is refinement: removing what’s extra until the essential sings. Under pressure, you may edit until nothing remains—your growth is trusting the first honest version and letting it live.",
    "You craft atmosphere like a language. When centered, you evoke meaning with restraint. When scattered, you chase mood without anchoring it—your lesson is returning to one clear intention and letting it govern the piece.",
    "You move through learning like a ritual: observe, practice, iterate. When balanced, your skill compounds. When depleted, you can become harsh with yourself—your edge is gentleness that still keeps standards.",
    "You make the personal feel universal. In strength, you metabolize experience into form. In shadow, you may hide behind symbolism—your path is allowing directness to coexist with depth."
  ];

  const catalog = [];
  const total = 900;

  for (let i = 1; i <= total; i++) {
    const id = `M${pad3(i)}`;
    const role = pick(roles, i - 1);
    const house = pick(houses, i + 7);
    const epithet = pick(epithets, i + 13);

    const name = makeName(role, house, epithet);

    const focus = pick(focuses, i);
    const summary = `You express a ${epithet.toLowerCase()} precision: vision shaped by ${role.toLowerCase()} discipline.`;

    const itemTags = [
      pick(tags, i),
      pick(tags, i + 3),
      pick(tags, i + 9)
    ];

    const strengths = [
      pick(strengthPhrases, i),
      pick(strengthPhrases, i + 2),
      pick(strengthPhrases, i + 6)
    ];

    const edges = [
      pick(growthEdges, i),
      pick(growthEdges, i + 4),
      pick(growthEdges, i + 7)
    ];

    const lore = {
      short: pick(loreShortTemplates, i),
      long: pick(loreLongTemplates, i)
    };

    catalog.push({
      id,
      name,
      focus,
      summary,
      tags: itemTags,
      strengths,
      growthEdges: edges,
      facetTitles: makeFacetTitles(role),
      lore
    });
  }

  const outDir = path.join(process.cwd(), "data", "archetypes");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, "main_v1.archetypes.json");
  fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2), "utf-8");
  console.log(`✅ Wrote ${catalog.length} archetypes -> ${outPath}`);
}

main();
