// backend/scripts/generateArchetypeLore900.mjs
import fs from "fs";
import path from "path";

const OUT = path.resolve("data", "lore.archetypes.900.json");

function pad3(n) {
  return String(n).padStart(3, "0");
}

function makeScienceShell(label) {
  return {
    summary: `${label} placeholder — expand later.`,
    concepts: [],
    frameworks: [],
    signals: [],
    risks: [],
    practices: [],
    sources: [],
  };
}

function entryFor(i) {
  const tag = `arch_${pad3(i)}`;
  const name = `Archetype ${pad3(i)}`;

  return {
    type: "archetype",
    tag,
    name,
    tagline: "",
    oneLine: "",
    lore: "",
    symbols: [],
    motifs: [],
    science: {
      psychology: makeScienceShell("Psychology"),
      sociology: makeScienceShell("Sociology"),
      anthropology: makeScienceShell("Anthropology"),
      pedagogy: makeScienceShell("Pedagogy"),
      neuroscience: makeScienceShell("Neuroscience"),
      philosophy: makeScienceShell("Philosophy"),
      communication: makeScienceShell("Communication"),
      leadership: makeScienceShell("Leadership"),
    },
    version: 1,
    lastEditedBy: "seed",
  };
}

const items = [];
for (let i = 1; i <= 900; i++) items.push(entryFor(i));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(items, null, 2), "utf8");

console.log(`✅ Wrote ${items.length} archetype lore entries to ${OUT}`);
