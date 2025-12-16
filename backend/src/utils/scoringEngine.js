function scoreTest(testId, answers) {
  const score = answers.reduce((a, b) => a + b, 0);

  const archetypes = {
    language_v1: ["Polyglot", "Linguist", "Archivist"],
    artist_v1: ["Creator", "Visionary", "Architect"],
    archetype_v1: ["Guide", "Watcher", "Catalyst"],
    shadow_v1: ["Doubt", "Control", "Isolation"],
    luminary_v1: ["Beacon", "Alchemist", "Ascendant"]
  };

  const list = archetypes[testId] || [];
  const primary = list[score % list.length] || "Unknown";

  return {
    testId,
    primary,
    secondary: score % 2 === 0 ? "Structured" : "Fluid",
    overview: `Your responses align most strongly with the ${primary} pattern.`,
    flags: testId === "shadow_v1" && score < 2 ? ["unresolved-shadow"] : [],
    rawScore: score
  };
}

module.exports = { scoreTest };
