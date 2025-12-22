// backend/scripts/generateMajorBank_v6.mjs
import fs from "fs";
import path from "path";

const OUT_PATH = path.join(process.cwd(), "data", "majorTest.bank.json");

// --- Config ---
const DAYS = [
  { day: 1, title: "Observation", notes: "Baseline + how you perceive." },
  { day: 2, title: "Composition", notes: "Structure, restraint, arrangement." },
  { day: 3, title: "Value & Light", notes: "Contrast, clarity, presence." },
  { day: 4, title: "Form & Depth", notes: "Systems, spatial thinking, precision." },
  { day: 5, title: "Symbol & Story", notes: "Meaning, myth, personal language." },
  { day: 6, title: "Style & Voice", notes: "Taste, refinement, signature." },
  { day: 7, title: "Portfolio & Integration", notes: "Synthesis + closure." },
];

const PER_TYPE_PER_DAY = 15;

// 16 constellations from your bank style (C01..C16)
const CONSTS = Array.from({ length: 16 }, (_, i) => `C${String(i + 1).padStart(2, "0")}`);
const TONES = ["lum", "mix", "shd"];

function pick(arr, idx) {
  return arr[idx % arr.length];
}

function mkSignal(day, i, toneHint = null) {
  // Deterministic but varied
  const c1 = pick(CONSTS, day + i);
  const c2 = pick(CONSTS, day + i * 3 + 5);
  const tone = toneHint || pick(TONES, day + i * 7);
  const weight = 2;
  return { const: [c1, c2], tone, weight };
}

function mkSingle(day, i, theme) {
  const id = `D${day}_S${String(i).padStart(2, "0")}`;
  return {
    id,
    day,
    type: "single",
    category: `${theme} — Single`,
    prompt: `(${theme}) Single #${i}: Which option best matches you today?`,
    required: true,
    options: [
      { id: 0, label: "Principle-first (clarity over comfort).", signal: mkSignal(day, i, "lum") },
      { id: 1, label: "Care-first (people over pride).", signal: mkSignal(day, i, "lum") },
      { id: 2, label: "Experiment-first (try, observe, correct).", signal: mkSignal(day, i, "mix") },
      { id: 3, label: "Control-first (structure and defensible logic).", signal: mkSignal(day, i, "mix") },
    ],
  };
}

function mkMulti(day, i, theme) {
  const id = `D${day}_M${String(i).padStart(2, "0")}`;
  return {
    id,
    day,
    type: "multi",
    category: `${theme} — Multi`,
    prompt: `(${theme}) Multi #${i}: Pick up to TWO tendencies that show up under pressure.`,
    required: true,
    maxPicks: 2,
    options: [
      { id: 0, label: "Audit details, tighten standards.", signal: mkSignal(day, i, "shd") },
      { id: 1, label: "Over-carry responsibility, become the fixer.", signal: mkSignal(day, i, "mix") },
      { id: 2, label: "Withdraw for control and perspective.", signal: mkSignal(day, i, "shd") },
      { id: 3, label: "Disrupt the stuck pattern to force movement.", signal: mkSignal(day, i, "mix") },
      { id: 4, label: "Protect harmony, avoid rupture.", signal: mkSignal(day, i, "mix") },
    ],
  };
}

function mkScale(day, i, theme) {
  const id = `D${day}_L${String(i).padStart(2, "0")}`;
  return {
    id,
    day,
    type: "scale",
    category: `${theme} — Scale`,
    prompt: `(${theme}) Scale #${i}: I can repeat a practice daily without needing motivation.`,
    required: true,
    scale: { min: 1, max: 7, neutral: 4, labels: { 1: "Never", 4: "Sometimes", 7: "Always" } },
    anchors: {
      low: { signal: mkSignal(day, i, "shd") },
      high: { signal: mkSignal(day, i, "lum") },
    },
  };
}

function mkRank(day, i, theme) {
  const id = `D${day}_R${String(i).padStart(2, "0")}`;
  const items = [
    { id: "A", label: "Clarity and truth." },
    { id: "B", label: "Belonging and harmony." },
    { id: "C", label: "Autonomy and escape routes." },
    { id: "D", label: "Mastery and respect." },
    { id: "E", label: "Meaning and closure." },
  ];
  return {
    id,
    day,
    type: "rank",
    category: `${theme} — Rank`,
    prompt: `(${theme}) Rank #${i}: Rank what you want MOST (1) to LEAST (5) today.`,
    required: true,
    items,
    rankSignals: {
      A: mkSignal(day, i + 1, "lum"),
      B: mkSignal(day, i + 2, "mix"),
      C: mkSignal(day, i + 3, "shd"),
      D: mkSignal(day, i + 4, "mix"),
      E: mkSignal(day, i + 5, "mix"),
    },
  };
}

function mkText(day, i, theme) {
  const id = `D${day}_T${String(i).padStart(2, "0")}`;
  return {
    id,
    day,
    type: "text",
    category: `${theme} — Text`,
    prompt: `(${theme}) Text #${i}: In 2–4 sentences, describe your current inner climate (calm, severe, luminous, etc.).`,
    required: true,
    // Optional scoring (you can remove signal if you want text to be unscored)
    signal: mkSignal(day, i, "mix"),
    notes: "Text is scored only because a signal is attached.",
  };
}

function mkFile(day, i, theme) {
  const id = `D${day}_F${String(i).padStart(2, "0")}`;
  return {
    id,
    day,
    type: "file",
    category: `${theme} — File`,
    prompt: `(${theme}) File #${i}: Upload an image that represents today’s focus (study, sketch, reference, etc.).`,
    required: true,
    accept: ["image/png", "image/jpeg", "image/webp"],
    // Optional scoring: keep signal if you want file uploads to contribute points
    signal: mkSignal(day, i, "lum"),
    notes: "Uploads are scored only because a signal is attached.",
  };
}

function mkCheck(day, i, theme) {
  const id = `D${day}_C${String(i).padStart(2, "0")}`;
  return {
    id,
    day,
    type: "check",
    category: `${theme} — Check`,
    prompt: `(${theme}) Check #${i}: Complete a 5-minute refined warm-up (line control / edges / value).`,
    required: true,
    signal: mkSignal(day, i, "lum"),
  };
}

function buildAssignmentsProgram() {
  // Keep your existing 7-day micro-assignments (3/day).
  // If you want these expanded too, say so and we’ll scale them.
  return {
    sevenDay: {
      id: "seven_day_art_v1",
      title: "7-Day Art Micro Assignments",
      notes: "3 small art assignments per day. Scorable. Designed for refined, intentional practice.",
      assignmentWeightMultiplier: 1,
      defaultSignalByTheme: {
        "Observation": { const: ["C12", "C02"], tone: "lum", weight: 1 },
        "Composition": { const: ["C12", "C14"], tone: "mix", weight: 1 },
        "Value & Light": { const: ["C16", "C14"], tone: "mix", weight: 1 },
        "Form & Depth": { const: ["C02", "C15"], tone: "mix", weight: 1 },
        "Symbol & Story": { const: ["C15", "C05"], tone: "mix", weight: 1 },
        "Style & Voice": { const: ["C05", "C12"], tone: "mix", weight: 1 },
        "Portfolio & Integration": { const: ["C10", "C16"], tone: "lum", weight: 1 },
      },
      days: DAYS.map((d) => ({
        day: d.day,
        theme: d.title,
        assignments: [
          {
            id: `A${d.day}_1`,
            type: "file",
            prompt: `(${d.title}) Upload one study or sketch from today (quick is fine).`,
            required: false,
            accept: ["image/png", "image/jpeg", "image/webp"],
            signal: { const: ["C12", "C02"], tone: "mix", weight: 1 },
          },
          {
            id: `A${d.day}_2`,
            type: "check",
            prompt: `(${d.title}) Mark complete: 10-minute focused practice.`,
            required: false,
            signal: { const: ["C02"], tone: "lum", weight: 1 },
          },
          {
            id: `A${d.day}_3`,
            type: "text",
            prompt: `(${d.title}) 1–2 sentences: what did you refine today?`,
            required: false,
            signal: { const: ["C05"], tone: "mix", weight: 1 },
          },
        ],
      })),
    },
  };
}

function main() {
  const questions = [];

  for (const d of DAYS) {
    for (let i = 1; i <= PER_TYPE_PER_DAY; i++) questions.push(mkSingle(d.day, i, d.title));
    for (let i = 1; i <= PER_TYPE_PER_DAY; i++) questions.push(mkMulti(d.day, i, d.title));
    for (let i = 1; i <= PER_TYPE_PER_DAY; i++) questions.push(mkScale(d.day, i, d.title));
    for (let i = 1; i <= PER_TYPE_PER_DAY; i++) questions.push(mkRank(d.day, i, d.title));
    for (let i = 1; i <= PER_TYPE_PER_DAY; i++) questions.push(mkText(d.day, i, d.title));
    for (let i = 1; i <= PER_TYPE_PER_DAY; i++) questions.push(mkFile(d.day, i, d.title));
    for (let i = 1; i <= PER_TYPE_PER_DAY; i++) questions.push(mkCheck(d.day, i, d.title));
  }

  const bank = {
    id: "major_v6_7day_art_15_each_type_per_day",
    title: "Major Archetype Test (7-Day) — 15 of Each Type / Day",
    version: 6,
    scoringModel: "constellation_optionB",
    defaults: {
      choiceWeight: 2,
      multi: { maxPicksDefault: 2 },
      scale: { min: 1, max: 7, neutral: 4 },
    },
    majorSchedule: {
      mode: "seven_day",
      days: DAYS,
    },
    questions,
    programs: buildAssignmentsProgram(),
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(bank, null, 2), "utf8");

  const total = questions.length;
  console.log(`✅ Wrote ${total} questions to ${OUT_PATH}`);
  console.log(`   Per day: ${PER_TYPE_PER_DAY}×7 types = ${PER_TYPE_PER_DAY * 7}`);
  console.log(`   Total days: ${DAYS.length} => ${PER_TYPE_PER_DAY * 7 * DAYS.length}`);
}

main();
