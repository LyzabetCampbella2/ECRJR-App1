export function scoreMajorTest(questions, answers) {
  // scores: { archId: number }
  const scores = {};

  for (const q of questions || []) {
    const qid = q.id || q.qid;
    const a = answers?.[qid];
    if (a == null) continue;

    // Supported scoring formats:
    // q.scoring[answerValue] = { arch_0001: 2, arch_0002: 1 }
    // OR q.scores[answerValue] = { ... }
    // OR options include scores: [{ value, scores: {arch: n}}]
    const byValue = q.scoring || q.scores || null;

    if (byValue && byValue[a]) {
      const map = byValue[a] || {};
      for (const [archId, delta] of Object.entries(map)) {
        scores[archId] = (scores[archId] || 0) + Number(delta || 0);
      }
      continue;
    }

    // Option-level scoring
    const options = q.options || q.choices || [];
    const optObj = options.find((o) => (typeof o === "string" ? o === a : (o.value ?? o.label ?? o.text) === a));
    const map = (typeof optObj === "object" && optObj?.scores) ? optObj.scores : null;

    if (map) {
      for (const [archId, delta] of Object.entries(map)) {
        scores[archId] = (scores[archId] || 0) + Number(delta || 0);
      }
    }
  }

  const ranked = Object.entries(scores)
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);

  return {
    scores,
    ranked,
    topArchetypes: ranked.slice(0, 7)
  };
}
