import fs from "fs";
import path from "path";

const OUT = path.resolve("data/testBanks/archetypeTest.bank.json");

const DIMS = [
  "verificationNeed",
  "ambiguityTolerance",
  "decisionLatency",
  "systemsThinking",
  "authorityPosture",
  "noveltyDrive",
  "careOrientation",
  "structurePreference"
];

// 12 questions per dim = 96 total (solid). Change to 15 if you want 120.
const PER_DIM = 12;

const promptPools = {
  verificationNeed: [
    "I prefer to verify claims with evidence before I accept them.",
    "I feel uneasy when decisions are made without data.",
    "I double-check details even when others are satisfied.",
    "I trust processes that are measurable and auditable."
  ],
  ambiguityTolerance: [
    "I’m comfortable moving forward with incomplete information.",
    "Uncertainty energizes me more than it scares me.",
    "I can hold multiple interpretations without needing one answer.",
    "I adapt quickly when the plan changes mid-stream."
  ],
  decisionLatency: [
    "I decide quickly once I understand the goal.",
    "I can choose a direction even when outcomes are unclear.",
    "I prefer fast iteration over long deliberation.",
    "I don’t need perfect certainty to act."
  ],
  systemsThinking: [
    "I naturally look for root causes, not just symptoms.",
    "I notice feedback loops and unintended consequences.",
    "I prefer solutions that improve the whole system.",
    "I map relationships between parts before changing anything."
  ],
  authorityPosture: [
    "I’m comfortable taking charge when needed.",
    "I prefer clear roles and accountability.",
    "I can hold firm boundaries even if others resist.",
    "I feel responsible for outcomes when I’m leading."
  ],
  noveltyDrive: [
    "I’m drawn to new ideas even if they disrupt routine.",
    "I enjoy experimenting to discover better approaches.",
    "I often reframe problems in unexpected ways.",
    "I get bored when everything stays the same."
  ],
  careOrientation: [
    "I prioritize emotional safety in groups.",
    "I naturally check how people are feeling.",
    "I’m protective of vulnerable people or spaces.",
    "I value harmony and repair after conflict."
  ],
  structurePreference: [
    "I work best with clear structure and routines.",
    "I prefer defined steps over improvisation.",
    "I like plans, frameworks, and consistent standards.",
    "I get stressed when expectations are vague."
  ]
};

function pick(arr, i) {
  return arr[i % arr.length];
}

function buildQuestions() {
  const questions = [];
  let qn = 0;

  for (const dim of DIMS) {
    for (let i = 0; i < PER_DIM; i++) {
      qn += 1;
      const reverse = (i % 6 === 5); // 1 reverse per 6 to reduce acquiescence bias

      questions.push({
        id: `q_${String(qn).padStart(3, "0")}`,
        text: pick(promptPools[dim], i) + (reverse ? " (reverse)" : ""),
        dim,        // <-- key upgrade
        reverse     // <-- scoring uses this
      });
    }
  }

  return questions;
}

function main() {
  const bank = {
    testId: "archetype_main",
    title: "Archetype Test",
    version: 2,
    format: "scale_0_4",
    dims: DIMS,
    questions: buildQuestions()
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(bank, null, 2), "utf8");

  console.log("✅ Wrote:", OUT);
  console.log("✅ Questions:", bank.questions.length);
}

main();
