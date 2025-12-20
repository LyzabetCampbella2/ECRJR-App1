export const familyLoreTemplates = {
  Alchemy: ({ name }) => ({
    oneLiner: `${name} turns lived experience into precise transformation—ritualized craft, not chaos.`,
    overview:
      `Alchemy archetypes metabolize change. They refine the raw, separate signal from noise, and produce usable form: method, artifact, or vow.`,
    gifts: [
      "Transmutation through process",
      "Pattern recognition and refinement",
      "Building repeatable rituals that stabilize growth"
    ],
    risks: [
      "Over-control disguised as ‘standards’",
      "Perfection paralysis",
      "Forgetting the human while polishing the tool"
    ],
    healerPath:
      "Return to the body and the calendar: small consistent rituals. Replace ‘perfect’ with ‘true enough to move.’",
    alchemyNotes:
      "Associated with distillation, binding, purification, and the ethics of making.",
    prompts: [
      "What am I trying to ‘purify’ that actually needs compassion?",
      "What is the smallest repeatable ritual that moves this forward?"
    ]
  }),

  Shadow: ({ name }) => ({
    oneLiner: `${name} is the intelligence of the wound—powerful, protective, and dangerously convincing.`,
    overview:
      "Shadow archetypes are adaptive strategies born in threat. They protect you, but they also distort: they swap intimacy for control and truth for survival.",
    gifts: ["Hyper-awareness", "Fast pattern detection", "Boundary formation"],
    risks: ["Projection", "Control loops", "Self-fulfilling distrust"],
    healerPath:
      "Name the original threat. Separate then from now. Practice safe truth-telling in small doses.",
    alchemyNotes: "",
    prompts: ["What threat does this pattern believe is still present?", "What would safety look like without control?"]
  }),

  Healer: ({ name }) => ({
    oneLiner: `${name} restores life-force by making pain legible and survivable.`,
    overview:
      "Healer archetypes translate suffering into meaning and care. They stabilize groups, mend bonds, and teach resilience—when they remember to receive too.",
    gifts: ["Repair work", "Compassionate clarity", "Nervous-system leadership"],
    risks: ["Over-responsibility", "Rescue addiction", "Burnout"],
    healerPath:
      "Shift from saving to strengthening. Ask: ‘What support makes you more capable?’",
    alchemyNotes: "",
    prompts: ["Where am I over-functioning?", "What care am I avoiding receiving?"]
  }),
};
