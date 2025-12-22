// scripts/generateCanon.mjs
// Run: node scripts/generateCanon.mjs
// Generates:
//  - src/data/all900archetypes.json
//  - src/data/all1600_luminaries.json
//  - src/data/all1600_shadows.json
//  - src/data/lore.index.json

import fs from "fs";
import path from "path";

const OUT_DIR = path.join(process.cwd(), "src", "data");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function pad(num, len) {
  return String(num).padStart(len, "0");
}

// Deterministic “name” generator that you can later replace with real canon names.
// Uses a controlled vocabulary so everything feels coherent (academia / refined).
const WORD_A = [
  "Aurelian", "Verdant", "Obsidian", "Ivory", "Crimson", "Sable", "Cobalt", "Umbral",
  "Gilded", "Silent", "Radiant", "Arcane", "Lucid", "Iron", "Winter", "Elder",
];
const WORD_B = [
  "Cartographer", "Archivist", "Herald", "Warden", "Scholar", "Chronicler", "Mediator",
  "Alchemist", "Sentinel", "Weaver", "Seer", "Scribe", "Adjudicator", "Gardener",
  "Navigator", "Artificer",
];

function makeName(i, kind) {
  // kind: "arch" | "lum" | "shd"
  const a = WORD_A[i % WORD_A.length];
  const b = WORD_B[(Math.floor(i / WORD_A.length) + (kind === "shd" ? 7 : 0)) % WORD_B.length];
  if (kind === "arch") return `${a} ${b}`;
  if (kind === "lum") return `${a} ${b} (Luminary)`;
  return `${a} ${b} (Shadow)`;
}

function loreBlock(label, toneHint) {
  return {
    label,
    summary: "",       // 1–2 sentence hook
    long: "",          // full lore paragraph(s)
    cues: [],          // bullet cues for UI
    tone: toneHint,    // helpful for future writing passes
  };
}

function mkDomains() {
  return {
    psychology: { notes: "", signals: [] },
    sociology: { notes: "", signals: [] },
    pedagogy: { notes: "", signals: [] },
    anthropology: { notes: "", signals: [] },
  };
}

function mkSignals() {
  return {
    gifts: [],        // what it brings when integrated
    strengths: [],
    risks: [],        // failure modes
    triggers: [],
    growth: [],       // what helps
    relationships: [],
  };
}

// --- Create Luminaries/Shadows (800 + 800 = 1600) ---
function buildLuminaries(count = 800) {
  const list = [];
  for (let i = 1; i <= count; i++) {
    const id = `lum_${pad(i, 4)}`;
    const tag = `LUM_${pad(i, 4)}`;
    list.push({
      id,
      kind: "luminary",
      tag,
      name: makeName(i, "lum"),
      aliases: [],
      constellation: `C${pad(((i - 1) % 16) + 1, 2)}`, // 16 buckets for now
      domains: mkDomains(),
      signals: mkSignals(),
      lore: {
        A: loreBlock("A", "noble/constructive"),
        B: loreBlock("B", "social expression"),
        C: loreBlock("C", "pressure test"),
        D: loreBlock("D", "integration / mastery"),
      },
      ui: {
        icon: "star",
        colorHint: "light",
      },
      meta: {
        version: 1,
        createdBy: "generator",
      },
    });
  }
  return list;
}

function buildShadows(count = 800) {
  const list = [];
  for (let i = 1; i <= count; i++) {
    const id = `shd_${pad(i, 4)}`;
    const tag = `SHD_${pad(i, 4)}`;
    list.push({
      id,
      kind: "shadow",
      tag,
      name: makeName(i, "shd"),
      aliases: [],
      constellation: `C${pad(((i - 1) % 16) + 1, 2)}`,
      domains: mkDomains(),
      signals: mkSignals(),
      lore: {
        A: loreBlock("A", "wound / distortion"),
        B: loreBlock("B", "defense pattern"),
        C: loreBlock("C", "cost of avoidance"),
        D: loreBlock("D", "alchemy / repair path"),
      },
      ui: {
        icon: "moon",
        colorHint: "dark",
      },
      meta: {
        version: 1,
        createdBy: "generator",
      },
    });
  }
  return list;
}

// --- Create Archetypes (900) ---
// Each archetype references lum/shd tags so your scoring + profile page can link.
function buildArchetypes(count = 900, lumCount = 800, shdCount = 800) {
  const list = [];
  for (let i = 1; i <= count; i++) {
    const id = `arch_${pad(i, 3)}`;
    const tag = `ARCH_${pad(i, 3)}`;

    // Deterministic, evenly distributed references:
    const lumA = ((i * 7) % lumCount) + 1;
    const lumB = ((i * 13) % lumCount) + 1;
    const shdA = ((i * 9) % shdCount) + 1;
    const shdB = ((i * 17) % shdCount) + 1;

    list.push({
      id,
      kind: "archetype",
      tag,
      name: makeName(i, "arch"),
      subtitle: "",
      constellation: `C${pad(((i - 1) % 16) + 1, 2)}`,
      luminaryTags: [`LUM_${pad(lumA, 4)}`, `LUM_${pad(lumB, 4)}`],
      shadowTags: [`SHD_${pad(shdA, 4)}`, `SHD_${pad(shdB, 4)}`],
      domains: mkDomains(),
      signals: mkSignals(),
      lore: {
        A: loreBlock("A", "core identity"),
        B: loreBlock("B", "social mask / role"),
        C: loreBlock("C", "pressure & fracture"),
        D: loreBlock("D", "integration / legacy"),
      },
      ui: {
        icon: "sigil",
        colorHint: "neutral",
      },
      meta: {
        version: 1,
        createdBy: "generator",
      },
    });
  }
  return list;
}

// --- Index for Lore browsing/search ---
// Provides a small searchable list without loading huge objects immediately.
function buildLoreIndex(archetypes, luminaries, shadows) {
  const toIndex = (x) => ({
    id: x.id,
    kind: x.kind,
    tag: x.tag,
    name: x.name,
    constellation: x.constellation,
    // Keep these short so LoreIndexPage loads fast:
    keywords: [
      x.name,
      x.tag,
      x.constellation,
      ...(x.aliases || []),
    ].filter(Boolean),
  });

  return [
    ...archetypes.map(toIndex),
    ...luminaries.map(toIndex),
    ...shadows.map(toIndex),
  ];
}

function writeJson(filename, data) {
  const outPath = path.join(OUT_DIR, filename);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf8");
  console.log(`✅ Wrote ${filename} (${Array.isArray(data) ? data.length : "object"})`);
}

function main() {
  ensureDir(OUT_DIR);

  const luminaries = buildLuminaries(800);
  const shadows = buildShadows(800);
  const archetypes = buildArchetypes(900, 800, 800);
  const loreIndex = buildLoreIndex(archetypes, luminaries, shadows);

  writeJson("all1600_luminaries.json", luminaries);
  writeJson("all1600_shadows.json", shadows);
  writeJson("all900archetypes.json", archetypes);
  writeJson("lore.index.json", loreIndex);

  console.log("🎯 Done. Next: wire these into LoreIndexPage + LoreEntryPage + ArchetypePage.");
}

main();
