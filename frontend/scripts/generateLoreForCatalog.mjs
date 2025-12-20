import fs from "fs";
import path from "path";

const CATALOG_PATH = path.resolve("src/data/archetypesCatalog.json");

// keep templates server-side too if you prefer; for now we embed minimal templates here
const templates = {
  Alchemy: ({ name }) => ({
    oneLiner: `${name} turns lived experience into precise transformation—ritualized craft, not chaos.`,
    overview: `Alchemy archetypes metabolize change through process and refinement.`,
    gifts: ["Transmutation through process", "Ritual craft", "Signal from noise"],
    risks: ["Perfection paralysis", "Over-control", "Cold standards"],
    healerPath: "Replace ‘perfect’ with ‘true enough to move.’",
    alchemyNotes: "Distillation, binding, purification, ethics of making.",
    prompts: ["What needs compassion—not polishing?", "What tiny ritual moves this forward?"]
  })
};

function nowISO() { return new Date().toISOString(); }

const raw = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf-8"));
const entries = Array.isArray(raw) ? raw : (raw.entries || []);

let changed = 0;
for (const a of entries) {
  const family = a.family || "Alchemy";
  const hasLore = a.lore && (a.lore.oneLiner || a.lore.overview);
  if (!hasLore) {
    const gen = (templates[family] || templates.Alchemy)({ name: a.name || a.id });
    a.lore = { ...(a.lore || {}), ...gen };
    a.meta = { ...(a.meta || {}), updatedAt: nowISO(), source: a?.meta?.source || "seed" };
    changed++;
  }
}
import fs from "fs";
import path from "path";

const CATALOG_PATH = path.resolve("src/data/archetypesCatalog.json");

const templates = {
  Alchemy: ({ name }) => ({
    oneLiner: `${name} turns lived experience into usable transformation—process over panic.`,
    overview: "Alchemy metabolizes change: distillation, structure, craft, and ethical making.",
    gifts: ["Refinement", "Repeatable ritual"],
    risks: ["Over-control", "Perfection paralysis"],
    healerPath: "Replace ‘perfect’ with ‘true enough to move.’",
    alchemyNotes: "Distillation, binding, purification, ethics of making.",
    prompts: ["What small ritual moves this forward?", "Where is ‘better’ blocking ‘done’?"]
  }),

  Luminary: ({ name }) => ({
    oneLiner: `${name} radiates clarity that helps others choose well.`,
    overview: "Luminary archetypes carry signal: courage, coherence, and steady truth.",
    gifts: ["Ethical leadership", "Stabilizing presence"],
    risks: ["Over-duty", "Blind spots from certainty"],
    healerPath: "Keep the light—share the load.",
    alchemyNotes: "",
    prompts: ["What does integrity require today?", "Where can I be brave and kind?"]
  }),

  Shadow: ({ name }) => ({
    oneLiner: `${name} is a protective strategy—powerful, persuasive, and costly when unchecked.`,
    overview: "Shadow archetypes form under threat: they protect, but distort, especially in relationships.",
    gifts: ["Threat detection", "Boundary defense"],
    risks: ["Projection", "Control loops"],
    healerPath: "Separate then from now; build safety without control.",
    alchemyNotes: "",
    prompts: ["What threat does this pattern believe is present?", "What is one 1% trust step?"]
  }),

  Healer: ({ name }) => ({
    oneLiner: `${name} restores life-force by making pain legible and survivable.`,
    overview: "Healers stabilize and repair—when they remember to receive too.",
    gifts: ["Repair work", "Regulation"],
    risks: ["Over-responsibility", "Burnout"],
    healerPath: "Shift from saving to strengthening.",
    alchemyNotes: "",
    prompts: ["Where am I over-functioning?", "What care do I need to receive?"]
  }),

  Unassigned: ({ name }) => ({
    oneLiner: `${name} has not been assigned a family yet.`,
    overview: "This archetype needs classification (family/tags/signals) before full lore generation.",
    gifts: [],
    risks: [],
    healerPath: "",
    alchemyNotes: "",
    prompts: []
  })
};

function nowISO() { return new Date().toISOString(); }

const entries = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf-8"));

let changed = 0;

for (const e of entries) {
  const fam = e.family || "Unassigned";
  e.family = fam;

  const lore = e.lore || {};
  const missingCore = !lore.oneLiner || !lore.overview;

  if (missingCore) {
    const gen = (templates[fam] || templates.Unassigned)({ name: e.name || e.id });
    e.lore = { ...gen, ...lore }; // keep any manual fields you already wrote
    e.meta = { ...(e.meta || {}), updatedAt: nowISO(), source: e?.meta?.source || "seed" };
    changed++;
  }
}

fs.writeFileSync(CATALOG_PATH, JSON.stringify(entries, null, 2), "utf-8");
console.log(`✅ Lore generation complete. Updated ${changed} entries.`);

fs.writeFileSync(CATALOG_PATH, JSON.stringify(entries, null, 2), "utf-8");
console.log(`✅ Lore generation complete. Updated ${changed} entries.`);
