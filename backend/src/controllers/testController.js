const fs = require("fs");
const path = require("path");

/* =========================
   JSON PERSISTENCE (DEV DB)
   ========================= */

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "devdb.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readDb() {
  ensureDataDir();
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ profiles: {} }, null, 2), "utf8");
  }

  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    // If the JSON ever gets corrupted, recover safely.
    return { profiles: {} };
  }
}

function writeDb(db) {
  ensureDataDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function getOrCreateProfile(db, profileId) {
  if (!db.profiles) db.profiles = {};

  if (!db.profiles[profileId]) {
    db.profiles[profileId] = {
      _id: profileId,
      createdAt: new Date().toISOString(),
      activeTestId: "",
      completedTestIds: [],
      results: {},
      lastUpdatedAt: new Date().toISOString()
    };
  }

  return db.profiles[profileId];
}

/* =========================
   TEST ORDER + QUESTIONS
   ========================= */

const testOrder = ["language_v1", "artist_v1", "archetype_v1", "shadow_v1", "luminary_v1"];

// Minimal question bank (expand later; this is stable and won’t break)
const testQuestions = {
  language_v1: [
    { id: "l1", text: "Do you learn best by immersion or structure?", options: ["Immersion", "Structure"] },
    { id: "l2", text: "Do you prefer speaking early or waiting until confident?", options: ["Speak early", "Wait"] }
  ],
  artist_v1: [
    { id: "a1", text: "Do you create for expression or mastery?", options: ["Expression", "Mastery"] },
    { id: "a2", text: "Do you prefer planning or improvising?", options: ["Planning", "Improvising"] }
  ],
  archetype_v1: [
    { id: "r1", text: "Do you lead with logic or emotion?", options: ["Logic", "Emotion"] },
    { id: "r2", text: "Do you prefer solitude or collaboration?", options: ["Solitude", "Collaboration"] }
  ],
  shadow_v1: [
    { id: "s1", text: "When stressed, do you withdraw or overwork?", options: ["Withdraw", "Overwork"] },
    { id: "s2", text: "Is your inner critic loud or quiet?", options: ["Loud", "Quiet"] }
  ],
  luminary_v1: [
    { id: "u1", text: "What feels most like your gift?", options: ["Insight", "Momentum"] },
    { id: "u2", text: "Do you inspire through calm or intensity?", options: ["Calm", "Intensity"] }
  ]
};

/* =========================
   SCORING (SIMPLE + STABLE)
   ========================= */

// Deterministic “hash” so same answers produce same result
function stableHash(input) {
  const str = typeof input === "string" ? input : JSON.stringify(input);
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pickFrom(list, seed) {
  if (!list.length) return "Unknown";
  return list[seed % list.length];
}

function scoreTest(testId, answers) {
  const seed = stableHash({ testId, answers });

  // A small archetype set for now — expand anytime
  const primaries = ["Creator", "Polyglot", "Guide", "Scholar", "Nexus", "Watcher", "Artisan"];
  const secondaries = ["Seeker", "Anchor", "Catalyst", "Mystic", "Builder", "Adept", "Voyager"];

  const primary = pickFrom(primaries, seed);
  const secondary = pickFrom(secondaries, seed >> 1);

  const overview = `Your ${testId} pattern suggests a dominant ${primary} profile with a secondary ${secondary} influence.`;
  const flags = [];

  // Lightweight flag logic
  const answerText = JSON.stringify(answers || "").toLowerCase();
  if (answerText.includes("withdraw")) flags.push("Withdrawal under stress");
  if (answerText.includes("overwork")) flags.push("Overwork under stress");

  return {
    primary,
    secondary,
    overview,
    flags
  };
}

/* =========================
   CONTROLLERS
   ========================= */

/**
 * GET /api/tests/questions/:testId
 */
function getTestQuestions(req, res) {
  const { testId } = req.params;

  const questions = testQuestions[testId];
  if (!questions) {
    return res.status(404).json({
      success: false,
      message: `Unknown testId: ${testId}`
    });
  }

  return res.json({
    success: true,
    testId,
    questions
  });
}

/**
 * POST /api/tests/start
 * Body: { profileId, testId }
 */
function startTest(req, res) {
  const { profileId, testId } = req.body;

  if (!testQuestions[testId]) {
    return res.status(400).json({
      success: false,
      message: `Cannot start unknown testId: ${testId}`
    });
  }

  const db = readDb();
  const profile = getOrCreateProfile(db, profileId);

  // If already completed, don’t re-add; allow restart if you want later
  if (profile.completedTestIds.includes(testId)) {
    profile.activeTestId = ""; // completed
    profile.lastUpdatedAt = new Date().toISOString();
    writeDb(db);

    return res.json({
      success: true,
      message: "Test already completed",
      profileId,
      testId,
      activeTestId: profile.activeTestId,
      completedTestIds: profile.completedTestIds
    });
  }

  profile.activeTestId = testId;
  profile.lastUpdatedAt = new Date().toISOString();
  writeDb(db);

  return res.json({
    success: true,
    message: "Test started",
    profileId,
    testId,
    activeTestId: profile.activeTestId
  });
}

/**
 * POST /api/tests/submit
 * Body: { profileId, testId, answers }
 */
function submitTestAnswers(req, res) {
  const { profileId, testId, answers } = req.body;

  if (!testQuestions[testId]) {
    return res.status(400).json({
      success: false,
      message: `Unknown testId: ${testId}`
    });
  }

  const db = readDb();
  const profile = getOrCreateProfile(db, profileId);

  // Enforce orchestration: must submit the active test
  if (profile.activeTestId && profile.activeTestId !== testId) {
    return res.status(400).json({
      success: false,
      message: "Cannot submit this test right now",
      expectedTestId: profile.activeTestId,
      receivedTestId: testId
    });
  }

  const result = scoreTest(testId, answers);

  profile.results[testId] = result;

  if (!profile.completedTestIds.includes(testId)) {
    profile.completedTestIds.push(testId);
  }

  // Advance to next test in order
  const currentIndex = testOrder.indexOf(testId);
  const nextTestId = testOrder[currentIndex + 1] || "";

  profile.activeTestId = nextTestId;
  profile.lastUpdatedAt = new Date().toISOString();

  writeDb(db);

  return res.json({
    success: true,
    message: "Test submitted",
    profileId,
    testId,
    result,
    nextTestId: nextTestId || null,
    progress: {
      activeTestId: profile.activeTestId,
      completedTestIds: profile.completedTestIds
    }
  });
}

/**
 * GET /api/tests/results/:profileId
 */
function getResults(req, res) {
  const { profileId } = req.params;

  const db = readDb();
  const profile = db.profiles?.[profileId];

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: "Profile not found",
      profileId
    });
  }

  return res.json({
    success: true,
    profileId,
    results: profile.results || {}
  });
}

/**
 * GET /api/tests/export/:profileId
 */
function exportResults(req, res) {
  const { profileId } = req.params;

  const db = readDb();
  const profile = db.profiles?.[profileId];

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: "Profile not found for export",
      profileId
    });
  }

  return res.json({
    success: true,
    profileId,
    exportedAt: new Date().toISOString(),
    results: profile.results || {},
    progress: {
      activeTestId: profile.activeTestId || "",
      completedTestIds: profile.completedTestIds || []
    }
  });
}

/**
 * GET /api/tests/progress/:profileId
 */
function getTestProgress(req, res) {
  const { profileId } = req.params;

  const db = readDb();
  const profile = db.profiles?.[profileId];

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: "Profile not found",
      profileId
    });
  }

  return res.json({
    success: true,
    profileId,
    activeTestId: profile.activeTestId || "",
    completedTestIds: profile.completedTestIds || []
  });
}

module.exports = {
  getTestQuestions,
  startTest,
  submitTestAnswers,
  getResults,
  exportResults,
  getTestProgress
};
