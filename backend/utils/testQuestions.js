const QUESTION_BANKS = {
  language_v1: [
    {
      id: "lang_1",
      prompt: "How do you feel when learning a new language?",
      options: [
        "Excited and curious",
        "Focused and analytical",
        "Anxious but motivated",
        "Indifferent"
      ]
    },
    {
      id: "lang_2",
      prompt: "Which matters more to you?",
      options: [
        "Fluency",
        "Accuracy",
        "Cultural understanding",
        "Utility"
      ]
    }
  ],

  artist_v1: [
    {
      id: "art_1",
      prompt: "What drives your creative work most?",
      options: [
        "Expression",
        "Structure",
        "Emotion",
        "Meaning"
      ]
    }
  ],

  archetype_v1: [
    {
      id: "arch_1",
      prompt: "Which role do you naturally take?",
      options: [
        "Leader",
        "Observer",
        "Guide",
        "Challenger"
      ]
    }
  ],

  shadow_v1: [
    {
      id: "shadow_1",
      prompt: "What do you struggle with most?",
      options: [
        "Self-doubt",
        "Control",
        "Isolation",
        "Fear of failure"
      ]
    }
  ],

  luminary_v1: [
    {
      id: "lum_1",
      prompt: "What best represents your highest potential?",
      options: [
        "Wisdom",
        "Creation",
        "Service",
        "Transformation"
      ]
    }
  ]
};

function getQuestions(testId) {
  return QUESTION_BANKS[testId] || [];
}

module.exports = { getQuestions };
