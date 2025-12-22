// backend/scripts/generateMajorBank_v7.mjs
import fs from "fs";
import path from "path";

const OUT_PATH = path.join(process.cwd(), "data", "majorTest.bank.json");

// --------------------
// Config
// --------------------
const DAYS = [
  { day: 1, title: "Observation", notes: "Baseline + how you perceive." },
  { day: 2, title: "Composition", notes: "Structure, restraint, arrangement." },
  { day: 3, title: "Value & Light", notes: "Contrast, clarity, presence." },
  { day: 4, title: "Form & Depth", notes: "Systems, spatial thinking, precision." },
  { day: 5, title: "Symbol & Story", notes: "Meaning, myth, personal language." },
  { day: 6, title: "Style & Voice", notes: "Taste, refinement, signature." },
  { day: 7, title: "Portfolio & Integration", notes: "Synthesis + closure." },
];

const PER_TYPE_PER_DAY = 15; // required by your ask
const TYPES = ["single", "multi", "scale", "rank", "text", "file", "check"];

// Constellations + tones
const CONSTS = Array.from({ length: 16 }, (_, i) => `C${String(i + 1).padStart(2, "0")}`);
const TONES = ["lum", "mix", "shd"];

function pick(arr, idx) {
  return arr[idx % arr.length];
}

function tpl(str, vars) {
  return String(str).replace(/\{(\w+)\}/g, (_, k) => (vars?.[k] ?? `{${k}}`));
}

/**
 * Make signals deterministic but varied by:
 * day + type + lens + frame + index
 */
function mkSignal({ day, typeIdx, lensIdx, frameIdx, i, toneHint = null }) {
  const base = day * 97 + typeIdx * 131 + lensIdx * 61 + frameIdx * 17 + i * 29;

  const c1 = pick(CONSTS, base + 3);
  const c2 = pick(CONSTS, base + 11);
  const c3 = pick(CONSTS, base + 23);

  const tone = toneHint || pick(TONES, base + 7);

  // weight: keep consistent but allow slight variety
  const weight = 2;

  return { const: [c1, c2, c3], tone, weight };
}

// --------------------
// Day language (keeps days distinct)
// --------------------
const DAY_CONTEXT = {
  1: { focus: "noticing", mood: "clear-eyed", verb: "observe", pressure: "overwhelm" },
  2: { focus: "arranging", mood: "intentional", verb: "compose", pressure: "chaos" },
  3: { focus: "contrasting", mood: "luminous", verb: "clarify", pressure: "fatigue" },
  4: { focus: "structuring", mood: "precise", verb: "model", pressure: "complexity" },
  5: { focus: "symbolizing", mood: "mythic", verb: "translate", pressure: "meaning-loss" },
  6: { focus: "refining", mood: "sophisticated", verb: "edit", pressure: "noise" },
  7: { focus: "integrating", mood: "complete", verb: "synthesize", pressure: "fragmentation" },
};

// --------------------
// Option sets (prevents sameness in single/multi)
// --------------------
const SINGLE_OPTION_SETS = [
  [
    { id: 0, label: "Principle-first: choose what stays true even if it costs you.", tone: "lum" },
    { id: 1, label: "Care-first: protect people and relationships before pride.", tone: "lum" },
    { id: 2, label: "Experiment-first: act, observe, correct—fast learning loop.", tone: "mix" },
    { id: 3, label: "Structure-first: follow the most defensible logic chain.", tone: "mix" },
  ],
  [
    { id: 0, label: "Clarity-first: name the truth and accept the consequence.", tone: "mix" },
    { id: 1, label: "Harmony-first: reduce friction and stabilize the room.", tone: "mix" },
    { id: 2, label: "Autonomy-first: keep options open and protect independence.", tone: "shd" },
    { id: 3, label: "Mastery-first: prove competence through results and standards.", tone: "mix" },
  ],
  [
    { id: 0, label: "Boundaries-first: set terms early and keep them clean.", tone: "lum" },
    { id: 1, label: "Belonging-first: maintain loyalty, tradition, and continuity.", tone: "lum" },
    { id: 2, label: "Momentum-first: break inertia and create movement.", tone: "mix" },
    { id: 3, label: "Precision-first: verify details before committing.", tone: "shd" },
  ],
];

const MULTI_OPTION_SETS = [
  [
    { id: 0, label: "I over-check details and become exacting.", tone: "shd" },
    { id: 1, label: "I over-carry responsibility and become the fixer.", tone: "mix" },
    { id: 2, label: "I withdraw to regain control and perspective.", tone: "shd" },
    { id: 3, label: "I disrupt the pattern to force movement.", tone: "mix" },
    { id: 4, label: "I smooth tension and avoid rupture until later.", tone: "mix" },
  ],
  [
    { id: 0, label: "I become blunt and cut through niceties.", tone: "mix" },
    { id: 1, label: "I become accommodating and postpone my needs.", tone: "shd" },
    { id: 2, label: "I isolate and go quiet.", tone: "shd" },
    { id: 3, label: "I micromanage to prevent mistakes.", tone: "mix" },
    { id: 4, label: "I try to rescue everyone’s emotions.", tone: "mix" },
  ],
  [
    { id: 0, label: "I chase perfection and delay finishing.", tone: "shd" },
    { id: 1, label: "I overcommit because I hate disappointing people.", tone: "mix" },
    { id: 2, label: "I procrastinate and numb out.", tone: "shd" },
    { id: 3, label: "I push harder and get intense.", tone: "mix" },
    { id: 4, label: "I become rigid about rules and correctness.", tone: "mix" },
  ],
];

// --------------------
// Prompt matrices: 5 lenses × 3 frames = 15
// Use {theme} {focus} {mood} {verb} {pressure}
// --------------------
const SINGLE_PROMPTS = [
  {
    lens: "attention",
    frames: [
      "({theme}) When you begin {focus}, what do you notice first?",
      "({theme}) Under {pressure}, what grabs your attention immediately?",
      "({theme}) In hindsight, what do you often realize you missed?",
    ],
  },
  {
    lens: "interpretation",
    frames: [
      "({theme}) When something is ambiguous, what is your default interpretation?",
      "({theme}) When stressed, how do you interpret unclear signals from others?",
      "({theme}) Looking back, are your first interpretations usually accurate?",
    ],
  },
  {
    lens: "threshold",
    frames: [
      "({theme}) What is the first sign you’re drifting out of your best state?",
      "({theme}) What is your most common breaking point under {pressure}?",
      "({theme}) What pattern repeats when you ignore your limits too long?",
    ],
  },
  {
    lens: "agency",
    frames: [
      "({theme}) When you feel stuck, what do you do first to regain agency?",
      "({theme}) Under pressure, what do you protect at all costs?",
      "({theme}) If you could change one habit instantly, what would it be?",
    ],
  },
  {
    lens: "standards",
    frames: [
      "({theme}) What do you refuse to compromise on when you {verb}?",
      "({theme}) When time is tight, what standard do you keep anyway?",
      "({theme}) What standard has helped you most long-term?",
    ],
  },
];

const MULTI_PROMPTS = [
  {
    lens: "pressure-behaviors",
    frames: [
      "({theme}) Pick up to TWO behaviors you slip into when things get intense.",
      "({theme}) Pick up to TWO behaviors that show up when you feel judged.",
      "({theme}) Pick up to TWO behaviors that show up when you feel behind.",
    ],
  },
  {
    lens: "avoidance",
    frames: [
      "({theme}) Pick up to TWO ways you avoid discomfort.",
      "({theme}) Pick up to TWO ways you avoid conflict.",
      "({theme}) Pick up to TWO ways you avoid finishing.",
    ],
  },
  {
    lens: "control",
    frames: [
      "({theme}) Pick up to TWO ways you try to control outcomes.",
      "({theme}) Pick up to TWO ways you try to control perception.",
      "({theme}) Pick up to TWO ways you try to control uncertainty.",
    ],
  },
  {
    lens: "collaboration",
    frames: [
      "({theme}) Pick up to TWO patterns you bring into teamwork.",
      "({theme}) Pick up to TWO patterns you bring into leadership.",
      "({theme}) Pick up to TWO patterns you bring into feedback.",
    ],
  },
  {
    lens: "recovery",
    frames: [
      "({theme}) Pick up to TWO things that help you recover fastest.",
      "({theme}) Pick up to TWO things that restore your {mood} focus.",
      "({theme}) Pick up to TWO things that pull you out of a spiral.",
    ],
  },
];

const SCALE_TRAITS = [
  { lens: "discipline", prompt: "I can repeat a practice daily without needing motivation." },
  { lens: "restraint", prompt: "I can keep things simple and refined instead of adding more." },
  { lens: "risk", prompt: "I can change course quickly when evidence says the plan is wrong." },
  { lens: "boundaries", prompt: "I set boundaries early rather than waiting until resentment." },
  { lens: "focus", prompt: "I can hold attention on one thing without fragmenting." },
];

const SCALE_FRAMES = [
  "({theme}) {trait}",
  "({theme}) Under {pressure}, {trait}",
  "({theme}) Over the long term, {trait}",
];

const RANK_BANK = [
  {
    lens: "values",
    frames: [
      "({theme}) Rank what you want MOST (1) to LEAST (5) today.",
      "({theme}) Rank what you want MOST (1) to LEAST (5) under {pressure}.",
      "({theme}) Rank what you want MOST (1) to LEAST (5) in your best state.",
    ],
    items: [
      { id: "A", label: "Clarity and truth." },
      { id: "B", label: "Belonging and harmony." },
      { id: "C", label: "Autonomy and escape routes." },
      { id: "D", label: "Mastery and respect." },
      { id: "E", label: "Meaning and closure." },
    ],
  },
  {
    lens: "craft",
    frames: [
      "({theme}) Rank what matters MOST (1) to LEAST (5) in your craft.",
      "({theme}) Rank what matters MOST (1) to LEAST (5) when time is tight.",
      "({theme}) Rank what matters MOST (1) to LEAST (5) when you’re proud of your work.",
    ],
    items: [
      { id: "A", label: "Clean structure." },
      { id: "B", label: "Emotional impact." },
      { id: "C", label: "Originality." },
      { id: "D", label: "Technical mastery." },
      { id: "E", label: "Refinement and restraint." },
    ],
  },
  {
    lens: "relationships",
    frames: [
      "({theme}) Rank what you need MOST (1) to LEAST (5) in relationships.",
      "({theme}) Rank what you need MOST (1) to LEAST (5) during conflict.",
      "({theme}) Rank what you need MOST (1) to LEAST (5) when building trust.",
    ],
    items: [
      { id: "A", label: "Honesty." },
      { id: "B", label: "Loyalty." },
      { id: "C", label: "Space." },
      { id: "D", label: "Direction." },
      { id: "E", label: "Gentleness." },
    ],
  },
  {
    lens: "identity",
    frames: [
      "({theme}) Rank what you protect MOST (1) to LEAST (5) about yourself.",
      "({theme}) Rank what you protect MOST (1) to LEAST (5) when criticized.",
      "({theme}) Rank what you protect MOST (1) to LEAST (5) when uncertain.",
    ],
    items: [
      { id: "A", label: "My integrity." },
      { id: "B", label: "My belonging." },
      { id: "C", label: "My freedom." },
      { id: "D", label: "My competence." },
      { id: "E", label: "My meaning." },
    ],
  },
  {
    lens: "energy",
    frames: [
      "({theme}) Rank what restores you MOST (1) to LEAST (5).",
      "({theme}) Rank what restores you MOST (1) to LEAST (5) after {pressure}.",
      "({theme}) Rank what restores you MOST (1) to LEAST (5) when you feel flat.",
    ],
    items: [
      { id: "A", label: "Solitude." },
      { id: "B", label: "Connection." },
      { id: "C", label: "Movement." },
      { id: "D", label: "Order." },
      { id: "E", label: "Beauty." },
    ],
  },
];

const TEXT_PROMPTS = [
  {
    lens: "lesson",
    frames: [
      "({theme}) In 2–4 sentences: what is your recurring life lesson right now?",
      "({theme}) In 2–4 sentences: what are you being asked to learn under {pressure}?",
      "({theme}) In 2–4 sentences: what lesson do you finally accept in hindsight?",
    ],
  },
  {
    lens: "boundary",
    frames: [
      "({theme}) What boundary would change everything if you honored it consistently?",
      "({theme}) What boundary do you abandon under {pressure}?",
      "({theme}) What boundary has protected you best long-term?",
    ],
  },
  {
    lens: "desire",
    frames: [
      "({theme}) What do you want that you rarely admit out loud?",
      "({theme}) Under {pressure}, what do you secretly want most?",
      "({theme}) Looking ahead, what do you want your life to feel like?",
    ],
  },
  {
    lens: "fear",
    frames: [
      "({theme}) What do you refuse to become, no matter what?",
      "({theme}) Under {pressure}, what version of you are you afraid of becoming?",
      "({theme}) In hindsight, what did you outgrow that once scared you?",
    ],
  },
  {
    lens: "voice",
    frames: [
      "({theme}) Describe your voice in one paragraph: calm, sharp, mythic, minimal—what fits?",
      "({theme}) When stressed, how does your voice change?",
      "({theme}) When you’re at your best, how does your voice lead others?",
    ],
  },
];

const FILE_PROMPTS = [
  {
    lens: "constraint",
    frames: [
      "({theme}) Upload a study made with ONE constraint (only lines, only shapes, or only 2 values).",
      "({theme}) Upload a study made FAST (max 5 minutes).",
      "({theme}) Upload a study made SLOW (min 20 minutes) with restraint and editing.",
    ],
  },
  {
    lens: "reference",
    frames: [
      "({theme}) Upload a photo reference you chose and explain (in your head) why it matters.",
      "({theme}) Upload a reference that challenges you (awkward angle / hard lighting).",
      "({theme}) Upload a reference that feels like home (comforting, familiar, loyal).",
    ],
  },
  {
    lens: "iteration",
    frames: [
      "({theme}) Upload version 1 of a sketch you will iterate later.",
      "({theme}) Upload version 2: the same subject, improved structure.",
      "({theme}) Upload version 3: the same subject, refined and simplified.",
    ],
  },
  {
    lens: "story",
    frames: [
      "({theme}) Upload an image that contains a symbol (even a simple shape) and feels {mood}.",
      "({theme}) Upload an image that suggests a narrative moment (before/after implied).",
      "({theme}) Upload an image that hides something (a secret, a shadow, a double meaning).",
    ],
  },
  {
    lens: "finish",
    frames: [
      "({theme}) Upload something you consider ‘finished enough’—practice completion.",
      "({theme}) Upload something you almost abandoned—practice return.",
      "({theme}) Upload your strongest piece today—practice selection.",
    ],
  },
];

const CHECK_PROMPTS = [
  {
    lens: "warmup",
    frames: [
      "({theme}) Complete: 5 minutes of refined line control (slow, steady).",
      "({theme}) Complete: 5 minutes of edges (hard vs soft) practice.",
      "({theme}) Complete: 5 minutes of proportion (big shapes first).",
    ],
  },
  {
    lens: "editing",
    frames: [
      "({theme}) Complete: remove 3 unnecessary marks from a sketch (edit aggressively).",
      "({theme}) Complete: simplify to 3 values (light/mid/dark).",
      "({theme}) Complete: one clean pass—no scribbling, no overworking.",
    ],
  },
  {
    lens: "courage",
    frames: [
      "({theme}) Complete: draw something slightly uncomfortable (hands, faces, perspective).",
      "({theme}) Complete: ask for feedback (or self-critique) and note one improvement.",
      "({theme}) Complete: redo one small study instead of starting something new.",
    ],
  },
  {
    lens: "consistency",
    frames: [
      "({theme}) Complete: 10-minute practice even if motivation is low.",
      "({theme}) Complete: set a timer and do not stop until it ends.",
      "({theme}) Complete: do the smallest version of the task (minimum viable practice).",
    ],
  },
  {
    lens: "closure",
    frames: [
      "({theme}) Complete: label/date your work (archive ritual).",
      "({theme}) Complete: choose your best attempt and set it aside (selection ritual).",
      "({theme}) Complete: write one sentence describing what you refined (closure ritual).",
    ],
  },
];

// --------------------
// Programs (keep your micro-assignments)
// --------------------
function buildAssignmentsProgram() {
  return {
    sevenDay: {
      id: "seven_day_art_v1",
      title: "7-Day Art Micro Assignments",
      notes: "3 small art assignments per day. Scorable. Designed for refined, intentional practice.",
      assignmentWeightMultiplier: 1,
      defaultSignalByTheme: {
        Observation: { const: ["C12", "C02"], tone: "lum", weight: 1 },
        Composition: { const: ["C12", "C14"], tone: "mix", weight: 1 },
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

// --------------------
// Builders per type (15 each)
// i from 1..15 maps to:
// lensIdx = floor((i-1)/3)  => 0..4
// frameIdx = (i-1)%3        => 0..2
// --------------------
function mkSingle(day, i, theme) {
  const ctx = DAY_CONTEXT[day];
  const lensIdx = Math.floor((i - 1) / 3);
  const frameIdx = (i - 1) % 3;
  const block = SINGLE_PROMPTS[lensIdx];

  const optSet = pick(SINGLE_OPTION_SETS, day + lensIdx + frameIdx);
  const typeIdx = TYPES.indexOf("single");

  return {
    id: `D${day}_S${String(i).padStart(2, "0")}`,
    day,
    type: "single",
    category: `${theme} — ${block.lens}`,
    prompt: tpl(block.frames[frameIdx], { theme, ...ctx }),
    required: true,
    options: optSet.map((o, k) => ({
      id: o.id,
      label: o.label,
      signal: mkSignal({ day, typeIdx, lensIdx, frameIdx, i, toneHint: o.tone }),
    })),
  };
}

function mkMulti(day, i, theme) {
  const ctx = DAY_CONTEXT[day];
  const lensIdx = Math.floor((i - 1) / 3);
  const frameIdx = (i - 1) % 3;
  const block = MULTI_PROMPTS[lensIdx];

  const optSet = pick(MULTI_OPTION_SETS, day + lensIdx + frameIdx);
  const typeIdx = TYPES.indexOf("multi");

  return {
    id: `D${day}_M${String(i).padStart(2, "0")}`,
    day,
    type: "multi",
    category: `${theme} — ${block.lens}`,
    prompt: tpl(block.frames[frameIdx], { theme, ...ctx }),
    required: true,
    maxPicks: 2,
    options: optSet.map((o) => ({
      id: o.id,
      label: o.label,
      signal: mkSignal({ day, typeIdx, lensIdx, frameIdx, i, toneHint: o.tone }),
    })),
  };
}

function mkScale(day, i, theme) {
  const ctx = DAY_CONTEXT[day];
  const lensIdx = Math.floor((i - 1) / 3);
  const frameIdx = (i - 1) % 3;

  const trait = SCALE_TRAITS[lensIdx];
  const typeIdx = TYPES.indexOf("scale");

  return {
    id: `D${day}_L${String(i).padStart(2, "0")}`,
    day,
    type: "scale",
    category: `${theme} — ${trait.lens}`,
    prompt: tpl(SCALE_FRAMES[frameIdx], { theme, ...ctx, trait: trait.prompt }),
    required: true,
    scale: { min: 1, max: 7, neutral: 4, labels: { 1: "Never", 4: "Sometimes", 7: "Always" } },
    anchors: {
      low: { signal: mkSignal({ day, typeIdx, lensIdx, frameIdx, i, toneHint: "shd" }) },
      high: { signal: mkSignal({ day, typeIdx, lensIdx, frameIdx, i, toneHint: "lum" }) },
    },
  };
}

function mkRank(day, i, theme) {
  const ctx = DAY_CONTEXT[day];
  const lensIdx = Math.floor((i - 1) / 3);
  const frameIdx = (i - 1) % 3;

  const block = RANK_BANK[lensIdx];
  const typeIdx = TYPES.indexOf("rank");

  const items = block.items;

  // Each item gets a signal; the controller already supports rankSignals
  const rankSignals = {};
  for (let k = 0; k < items.length; k++) {
    const itemId = items[k].id;
    const toneHint = k === 0 ? "lum" : k === 2 ? "shd" : "mix";
    rankSignals[itemId] = mkSignal({ day, typeIdx, lensIdx, frameIdx, i: i + k, toneHint });
  }

  return {
    id: `D${day}_R${String(i).padStart(2, "0")}`,
    day,
    type: "rank",
    category: `${theme} — ${block.lens}`,
    prompt: tpl(block.frames[frameIdx], { theme, ...ctx }),
    required: true,
    items,
    rankSignals,
  };
}

function mkText(day, i, theme) {
  const ctx = DAY_CONTEXT[day];
  const lensIdx = Math.floor((i - 1) / 3);
  const frameIdx = (i - 1) % 3;
  const block = TEXT_PROMPTS[lensIdx];
  const typeIdx = TYPES.indexOf("text");

  return {
    id: `D${day}_T${String(i).padStart(2, "0")}`,
    day,
    type: "text",
    category: `${theme} — ${block.lens}`,
    prompt: tpl(block.frames[frameIdx], { theme, ...ctx }),
    required: true,
    // Text is scored because a signal is attached (you can remove if you want unscored text)
    signal: mkSignal({ day, typeIdx, lensIdx, frameIdx, i, toneHint: "mix" }),
    notes: "Text is scored because a signal is attached.",
  };
}

function mkFile(day, i, theme) {
  const ctx = DAY_CONTEXT[day];
  const lensIdx = Math.floor((i - 1) / 3);
  const frameIdx = (i - 1) % 3;
  const block = FILE_PROMPTS[lensIdx];
  const typeIdx = TYPES.indexOf("file");

  return {
    id: `D${day}_F${String(i).padStart(2, "0")}`,
    day,
    type: "file",
    category: `${theme} — ${block.lens}`,
    prompt: tpl(block.frames[frameIdx], { theme, ...ctx }),
    required: true,
    accept: ["image/png", "image/jpeg", "image/webp"],
    signal: mkSignal({ day, typeIdx, lensIdx, frameIdx, i, toneHint: "lum" }),
    notes: "Uploads are scored because a signal is attached.",
  };
}

function mkCheck(day, i, theme) {
  const ctx = DAY_CONTEXT[day];
  const lensIdx = Math.floor((i - 1) / 3);
  const frameIdx = (i - 1) % 3;
  const block = CHECK_PROMPTS[lensIdx];
  const typeIdx = TYPES.indexOf("check");

  return {
    id: `D${day}_C${String(i).padStart(2, "0")}`,
    day,
    type: "check",
    category: `${theme} — ${block.lens}`,
    prompt: tpl(block.frames[frameIdx], { theme, ...ctx }),
    required: true,
    signal: mkSignal({ day, typeIdx, lensIdx, frameIdx, i, toneHint: "lum" }),
  };
}

function buildQuestionsForDay(d) {
  const qs = [];
  for (let i = 1; i <= PER_TYPE_PER_DAY; i++) qs.push(mkSingle(d.day, i, d.title));
  for (let i = 1; i <= PER_TYPE_PER_DAY; i++) qs.push(mkMulti(d.day, i, d.title));
  for (let i = 1; i <= PER_TYPE_PER_DAY; i++) qs.push(mkScale(d.day, i, d.title));
  for (let i = 1; i <= PER_TYPE_PER_DAY; i++) qs.push(mkRank(d.day, i, d.title));
  for (let i = 1; i <= PER_TYPE_PER_DAY; i++) qs.push(mkText(d.day, i, d.title));
  for (let i = 1; i <= PER_TYPE_PER_DAY; i++) qs.push(mkFile(d.day, i, d.title));
  for (let i = 1; i <= PER_TYPE_PER_DAY; i++) qs.push(mkCheck(d.day, i, d.title));
  return qs;
}

function main() {
  const questions = DAYS.flatMap(buildQuestionsForDay);

  const bank = {
    id: "major_v7_7day_art_15_each_type_per_day_distinct",
    title: "Major Archetype Test (7-Day) — 15 of Each Type / Day (Distinct Prompts)",
    version: 7,
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

  const perDay = PER_TYPE_PER_DAY * TYPES.length;
  console.log(`✅ Wrote ${questions.length} questions to ${OUT_PATH}`);
  console.log(`   Per day: ${PER_TYPE_PER_DAY} per type × ${TYPES.length} types = ${perDay}`);
  console.log(`   Total days: ${DAYS.length} => ${perDay * DAYS.length}`);
}

main();
