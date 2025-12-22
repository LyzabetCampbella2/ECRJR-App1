// src/data/questions.js

export const QUESTION_TYPE = {
  SINGLE: "single",         // single choice
  MULTI: "multi",           // select multiple
  FILL: "fill_blank",       // fill-in blank(s)
  TEXT: "text",             // free response
  UPLOAD: "upload",         // upload image/video/audio/file
};

const uploadConstraintsDefault = {
  accept: ["image/*", "video/*"], // change per question
  maxFiles: 1,
  maxSizeMB: 30,
};

export const QUESTIONS = {
  // =========================================================
  // LANGUAGE V1 (mix: multiple choice, fill blanks, text, upload)
  // =========================================================
  language_v1: [
    {
      id: "lang_001",
      type: QUESTION_TYPE.SINGLE,
      prompt: "Which skill feels strongest for you in a new language?",
      options: [
        { id: "a", text: "Listening" },
        { id: "b", text: "Reading" },
        { id: "c", text: "Speaking" },
        { id: "d", text: "Writing" },
      ],
      scoring: { dimension: "self_profile", weight: 1.0 },
    },
    {
      id: "lang_002",
      type: QUESTION_TYPE.FILL,
      prompt: "Fill in the blank: I learn best when I can ________ the language daily.",
      blanks: [{ key: "b1", placeholder: "verb" }],
      scoring: { dimension: "learning_style", weight: 1.0 },
    },
    {
      id: "lang_003",
      type: QUESTION_TYPE.MULTI,
      prompt: "Select all that usually help you remember vocabulary.",
      options: [
        { id: "a", text: "Spaced repetition / flashcards" },
        { id: "b", text: "Using the word in a sentence" },
        { id: "c", text: "Associating with an image" },
        { id: "d", text: "Linking to a similar word in another language" },
        { id: "e", text: "Hearing it repeatedly in context" },
      ],
      scoring: { dimension: "memory_strategies", weight: 1.0 },
    },
    {
      id: "lang_004",
      type: QUESTION_TYPE.SINGLE,
      prompt: "If you don’t know a word while reading, what do you do first?",
      options: [
        { id: "a", text: "Guess from context and continue" },
        { id: "b", text: "Look it up immediately" },
        { id: "c", text: "Skip it and hope it becomes clear later" },
        { id: "d", text: "Re-read the sentence slowly and infer meaning" },
      ],
      scoring: { dimension: "context_inference", weight: 1.0 },
    },
    {
      id: "lang_005",
      type: QUESTION_TYPE.FILL,
      prompt: "Fill in the blank: The opposite of 'increase' is ________.",
      blanks: [{ key: "b1", placeholder: "word" }],
      scoring: { dimension: "vocab_basic", weight: 1.0 },
      validation: { minChars: 2, maxChars: 30 },
    },
    {
      id: "lang_006",
      type: QUESTION_TYPE.TEXT,
      prompt: "Write 2–3 sentences describing your current language-learning routine.",
      constraints: { minChars: 10, maxChars: 500 },
      scoring: { dimension: "qualitative", weight: 0.5 },
    },
    {
      id: "lang_007",
      type: QUESTION_TYPE.SINGLE,
      prompt: "When someone speaks quickly, you usually…",
      options: [
        { id: "a", text: "Catch the gist but miss details" },
        { id: "b", text: "Understand most of it" },
        { id: "c", text: "Lose track early" },
        { id: "d", text: "Need it repeated slower" },
      ],
      scoring: { dimension: "listening_processing", weight: 1.0 },
    },
    {
      id: "lang_008",
      type: QUESTION_TYPE.UPLOAD,
      prompt:
        "Upload a 10–30 second audio or video of you speaking (any language). (Optional but recommended)",
      upload: {
        accept: ["audio/*", "video/*"],
        maxFiles: 1,
        maxSizeMB: 50,
      },
      scoring: { dimension: "speaking_sample", weight: 0.0 }, // stored, not scored yet
      optional: true,
    },
    {
      id: "lang_009",
      type: QUESTION_TYPE.FILL,
      prompt: "Fill in the blank: I feel most confident speaking when I have ________ prepared.",
      blanks: [{ key: "b1", placeholder: "noun/phrase" }],
      scoring: { dimension: "confidence_context", weight: 1.0 },
    },
    {
      id: "lang_010",
      type: QUESTION_TYPE.TEXT,
      prompt: "What language goal matters most to you right now — and why?",
      constraints: { minChars: 10, maxChars: 500 },
      scoring: { dimension: "motivation", weight: 1.0 },
    },
  ],

  // =========================================================
  // ARTIST V1
  // =========================================================
  artist_v1: [
    {
      id: "art_001",
      type: QUESTION_TYPE.SINGLE,
      prompt: "When you create, what usually comes first?",
      options: [
        { id: "a", text: "A concept/message" },
        { id: "b", text: "A mood/vibe" },
        { id: "c", text: "A technique challenge" },
        { id: "d", text: "A story/character/scene" },
      ],
      scoring: { dimension: "entry_point", weight: 1.0 },
    },
    {
      id: "art_002",
      type: QUESTION_TYPE.MULTI,
      prompt: "Select the mediums you feel most drawn to.",
      options: [
        { id: "a", text: "Writing" },
        { id: "b", text: "Drawing/Painting" },
        { id: "c", text: "Music" },
        { id: "d", text: "Film/Video" },
        { id: "e", text: "Design/Branding" },
        { id: "f", text: "Craft/Handmade" },
      ],
      scoring: { dimension: "medium_affinity", weight: 1.0 },
    },
    {
      id: "art_003",
      type: QUESTION_TYPE.FILL,
      prompt: "Fill in the blank: My art feels most ‘true’ when it captures ________.",
      blanks: [{ key: "b1", placeholder: "idea/feeling" }],
      scoring: { dimension: "authenticity", weight: 1.0 },
    },
    {
      id: "art_004",
      type: QUESTION_TYPE.SINGLE,
      prompt: "What blocks you most often?",
      options: [
        { id: "a", text: "Perfectionism" },
        { id: "b", text: "Fear of judgment" },
        { id: "c", text: "Lack of time/energy" },
        { id: "d", text: "Not knowing what to make" },
      ],
      scoring: { dimension: "blockers", weight: 1.0 },
    },
    {
      id: "art_005",
      type: QUESTION_TYPE.TEXT,
      prompt: "Describe your ideal creative process from start to finish (as it is now or as you wish it was).",
      constraints: { minChars: 10, maxChars: 700 },
      scoring: { dimension: "process_map", weight: 1.0 },
    },
    {
      id: "art_006",
      type: QUESTION_TYPE.UPLOAD,
      prompt: "Upload 1–3 examples of your work (image/video).",
      upload: { ...uploadConstraintsDefault, maxFiles: 3, maxSizeMB: 50 },
      scoring: { dimension: "portfolio_sample", weight: 0.0 },
      optional: true,
    },
    {
      id: "art_007",
      type: QUESTION_TYPE.SINGLE,
      prompt: "Which feedback style helps you most?",
      options: [
        { id: "a", text: "Direct and technical" },
        { id: "b", text: "Gentle and encouraging" },
        { id: "c", text: "Big-picture concept critique" },
        { id: "d", text: "No feedback — I prefer solo iteration" },
      ],
      scoring: { dimension: "feedback_style", weight: 1.0 },
    },
    {
      id: "art_008",
      type: QUESTION_TYPE.FILL,
      prompt: "Fill in the blank: I’m proudest of my work when I ________.",
      blanks: [{ key: "b1", placeholder: "verb/phrase" }],
      scoring: { dimension: "achievement_driver", weight: 1.0 },
    },
    {
      id: "art_009",
      type: QUESTION_TYPE.MULTI,
      prompt: "Select what you want to improve most right now.",
      options: [
        { id: "a", text: "Consistency / routine" },
        { id: "b", text: "Technical skill" },
        { id: "c", text: "Originality / voice" },
        { id: "d", text: "Finishing projects" },
        { id: "e", text: "Sharing/marketing" },
      ],
      scoring: { dimension: "growth_targets", weight: 1.0 },
    },
    {
      id: "art_010",
      type: QUESTION_TYPE.TEXT,
      prompt: "Write a short artist statement (3–6 sentences).",
      constraints: { minChars: 20, maxChars: 900 },
      scoring: { dimension: "artist_statement", weight: 1.0 },
    },
  ],

  // =========================================================
  // SHADOW V1 (self-pattern + reflective, with optional media)
  // =========================================================
  shadow_v1: [
    {
      id: "sh_001",
      type: QUESTION_TYPE.SINGLE,
      prompt: "Under stress, what is your most common response?",
      options: [
        { id: "a", text: "I withdraw and go quiet" },
        { id: "b", text: "I control details / micromanage" },
        { id: "c", text: "I get reactive/angry" },
        { id: "d", text: "I people-please to avoid conflict" },
      ],
      scoring: { dimension: "stress_response", weight: 1.0 },
    },
    {
      id: "sh_002",
      type: QUESTION_TYPE.MULTI,
      prompt: "Select the patterns you recognize in yourself (even if you dislike them).",
      options: [
        { id: "a", text: "Perfectionism" },
        { id: "b", text: "Avoidance/procrastination" },
        { id: "c", text: "Overthinking/rumination" },
        { id: "d", text: "Jealousy/comparison" },
        { id: "e", text: "Self-criticism" },
        { id: "f", text: "Numbing/escapism" },
      ],
      scoring: { dimension: "shadow_patterns", weight: 1.0 },
    },
    {
      id: "sh_003",
      type: QUESTION_TYPE.FILL,
      prompt: "Fill in the blank: When I feel threatened, I tend to ________.",
      blanks: [{ key: "b1", placeholder: "verb/phrase" }],
      scoring: { dimension: "defense_style", weight: 1.0 },
    },
    {
      id: "sh_004",
      type: QUESTION_TYPE.TEXT,
      prompt: "Describe a recent moment you weren’t proud of. What triggered it?",
      constraints: { minChars: 10, maxChars: 700 },
      scoring: { dimension: "trigger_awareness", weight: 1.0 },
    },
    {
      id: "sh_005",
      type: QUESTION_TYPE.SINGLE,
      prompt: "When you fail at something important, your inner voice is usually…",
      options: [
        { id: "a", text: "Harsh and punishing" },
        { id: "b", text: "Calm and practical" },
        { id: "c", text: "Anxious and spiraling" },
        { id: "d", text: "Detached — I shut down" },
      ],
      scoring: { dimension: "inner_critic", weight: 1.0 },
    },
    {
      id: "sh_006",
      type: QUESTION_TYPE.UPLOAD,
      prompt: "Optional: Upload a short journal voice note (30–90 seconds) about your biggest recurring challenge.",
      upload: { accept: ["audio/*"], maxFiles: 1, maxSizeMB: 30 },
      scoring: { dimension: "shadow_voice_note", weight: 0.0 },
      optional: true,
    },
    {
      id: "sh_007",
      type: QUESTION_TYPE.FILL,
      prompt: "Fill in the blank: The thing I most fear people will see in me is ________.",
      blanks: [{ key: "b1", placeholder: "fear" }],
      scoring: { dimension: "core_fear", weight: 1.0 },
    },
    {
      id: "sh_008",
      type: QUESTION_TYPE.TEXT,
      prompt: "What coping strategy do you use that helps short-term but hurts long-term?",
      constraints: { minChars: 10, maxChars: 600 },
      scoring: { dimension: "maladaptive_coping", weight: 1.0 },
    },
  ],

  // =========================================================
  // LUMINARY V1 (strengths + values + vision, with optional media)
  // =========================================================
  luminary_v1: [
    {
      id: "lum_001",
      type: QUESTION_TYPE.MULTI,
      prompt: "Select the strengths people consistently notice in you.",
      options: [
        { id: "a", text: "Leadership" },
        { id: "b", text: "Empathy" },
        { id: "c", text: "Creativity" },
        { id: "d", text: "Discipline" },
        { id: "e", text: "Clarity/analysis" },
        { id: "f", text: "Courage under pressure" },
      ],
      scoring: { dimension: "strengths", weight: 1.0 },
    },
    {
      id: "lum_002",
      type: QUESTION_TYPE.SINGLE,
      prompt: "When you feel most alive, it’s usually because you are…",
      options: [
        { id: "a", text: "Building something meaningful" },
        { id: "b", text: "Helping/teaching others" },
        { id: "c", text: "Exploring/learning deeply" },
        { id: "d", text: "Creating beauty/expressing truth" },
      ],
      scoring: { dimension: "core_drive", weight: 1.0 },
    },
    {
      id: "lum_003",
      type: QUESTION_TYPE.FILL,
      prompt: "Fill in the blank: My highest standard for myself is ________.",
      blanks: [{ key: "b1", placeholder: "standard" }],
      scoring: { dimension: "standards", weight: 1.0 },
    },
    {
      id: "lum_004",
      type: QUESTION_TYPE.TEXT,
      prompt: "Describe a moment you overcame something hard. What quality carried you through?",
      constraints: { minChars: 10, maxChars: 800 },
      scoring: { dimension: "resilience", weight: 1.0 },
    },
    {
      id: "lum_005",
      type: QUESTION_TYPE.SINGLE,
      prompt: "Your ‘best self’ shows up most reliably when you have…",
      options: [
        { id: "a", text: "Structure and routine" },
        { id: "b", text: "Meaningful challenge" },
        { id: "c", text: "Supportive people around you" },
        { id: "d", text: "Creative freedom" },
      ],
      scoring: { dimension: "conditions_for_thrive", weight: 1.0 },
    },
    {
      id: "lum_006",
      type: QUESTION_TYPE.UPLOAD,
      prompt: "Optional: Upload a 15–60 second video introducing your vision for your life/work.",
      upload: { accept: ["video/*"], maxFiles: 1, maxSizeMB: 80 },
      scoring: { dimension: "vision_video", weight: 0.0 },
      optional: true,
    },
    {
      id: "lum_007",
      type: QUESTION_TYPE.MULTI,
      prompt: "Select the values you refuse to betray.",
      options: [
        { id: "a", text: "Truth" },
        { id: "b", text: "Loyalty" },
        { id: "c", text: "Freedom" },
        { id: "d", text: "Beauty" },
        { id: "e", text: "Justice" },
        { id: "f", text: "Growth" },
      ],
      scoring: { dimension: "values", weight: 1.0 },
    },
    {
      id: "lum_008",
      type: QUESTION_TYPE.TEXT,
      prompt: "Write your ‘north star’ sentence: what are you here to do?",
      constraints: { minChars: 10, maxChars: 240 },
      scoring: { dimension: "north_star", weight: 1.0 },
    },
  ],

  // =========================================================
  // ARCHETYPE V1 (identity signals + preferences + creative signature)
  // =========================================================
  archetype_v1: [
    {
      id: "arch_001",
      type: QUESTION_TYPE.SINGLE,
      prompt: "When entering a new community, you tend to…",
      options: [
        { id: "a", text: "Observe quietly first" },
        { id: "b", text: "Connect quickly with people" },
        { id: "c", text: "Take initiative and lead" },
        { id: "d", text: "Find the role nobody is doing and fill it" },
      ],
      scoring: { dimension: "social_entry", weight: 1.0 },
    },
    {
      id: "arch_002",
      type: QUESTION_TYPE.MULTI,
      prompt: "Select the themes that follow you through life/work.",
      options: [
        { id: "a", text: "Reinvention" },
        { id: "b", text: "Justice" },
        { id: "c", text: "Beauty" },
        { id: "d", text: "Power" },
        { id: "e", text: "Knowledge" },
        { id: "f", text: "Devotion" },
        { id: "g", text: "Freedom" },
        { id: "h", text: "Legacy" },
      ],
      scoring: { dimension: "themes", weight: 1.0 },
    },
    {
      id: "arch_003",
      type: QUESTION_TYPE.FILL,
      prompt: "Fill in the blank: People misunderstand me as ________, but I am actually ________.",
      blanks: [
        { key: "b1", placeholder: "misunderstood as" },
        { key: "b2", placeholder: "actually" },
      ],
      scoring: { dimension: "self_contrast", weight: 1.0 },
    },
    {
      id: "arch_004",
      type: QUESTION_TYPE.TEXT,
      prompt: "Describe your creative signature in one paragraph (what makes your output *yours*).",
      constraints: { minChars: 20, maxChars: 900 },
      scoring: { dimension: "signature", weight: 1.0 },
    },
    {
      id: "arch_005",
      type: QUESTION_TYPE.SINGLE,
      prompt: "Which role do you default into under pressure?",
      options: [
        { id: "a", text: "Strategist (plans, calculates, controls risk)" },
        { id: "b", text: "Guardian (protects, stabilizes, maintains)" },
        { id: "c", text: "Catalyst (acts fast, disrupts, initiates)" },
        { id: "d", text: "Seer (intuition, meaning, pattern recognition)" },
      ],
      scoring: { dimension: "pressure_role", weight: 1.0 },
    },
    {
      id: "arch_006",
      type: QUESTION_TYPE.UPLOAD,
      prompt: "Optional: Upload a piece that represents you (image/video/audio/file).",
      upload: { accept: ["image/*", "video/*", "audio/*", "application/pdf"], maxFiles: 2, maxSizeMB: 80 },
      scoring: { dimension: "symbolic_artifact", weight: 0.0 },
      optional: true,
    },
    {
      id: "arch_007",
      type: QUESTION_TYPE.MULTI,
      prompt: "Select what you want your archetype system to unlock for you.",
      options: [
        { id: "a", text: "Clarity and direction" },
        { id: "b", text: "Creative identity & brand voice" },
        { id: "c", text: "Better decisions & discipline" },
        { id: "d", text: "Healing / shadow integration" },
        { id: "e", text: "Community & collaboration" },
      ],
      scoring: { dimension: "outcomes", weight: 1.0 },
    },
    {
      id: "arch_008",
      type: QUESTION_TYPE.TEXT,
      prompt: "Write a short ‘myth line’ for yourself (1–2 sentences like a character intro).",
      constraints: { minChars: 10, maxChars: 240 },
      scoring: { dimension: "myth_line", weight: 1.0 },
    },
  ],
};

export function getQuestionsForTest(testId) {
  return QUESTIONS[testId] || [];
}
