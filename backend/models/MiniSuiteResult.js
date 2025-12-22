// backend/models/MiniSuiteResult.js
import mongoose from "mongoose";

const MiniAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    choiceKey: { type: String, required: true },
  },
  { _id: false }
);

const MiniSubmissionSchema = new mongoose.Schema(
  {
    miniTestId: { type: String, required: true },
    answers: { type: [MiniAnswerSchema], default: [] }, // ✅ matches answersByTest shape
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MiniTopItemSchema = new mongoose.Schema(
  {
    tag: { type: String, required: true },
    name: { type: String, default: "" },
    score: { type: Number, default: 0 },
    family: { type: String, default: "" },
  },
  { _id: false }
);

const MiniSuiteRunSchema = new mongoose.Schema(
  {
    runId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },

    luminaries: { type: [MiniTopItemSchema], default: [] },
    shadows: { type: [MiniTopItemSchema], default: [] },

    signals: {
      confidence: { type: Number, default: 0 },
      completedMiniTests: { type: [String], default: [] },
    },

    debug: {
      luminaryTags: { type: Object, default: {} },
      shadowTags: { type: Object, default: {} },
    },
  },
  { _id: false }
);

const MiniSuiteResultSchema = new mongoose.Schema(
  {
    // Keep one doc per profile (latest snapshot + history)
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      unique: true,
    },

    suiteStatus: {
      type: String,
      enum: ["in_progress", "finished"],
      default: "in_progress",
    },

    // Optional: store raw submissions (useful later)
    submissions: { type: [MiniSubmissionSchema], default: [] },

    // ✅ History of runs + latest snapshot
    runs: { type: [MiniSuiteRunSchema], default: [] },

    latestRunId: { type: String, default: "" },
    latestCreatedAt: { type: Date },

    topLuminaries: { type: [MiniTopItemSchema], default: [] },
    topShadows: { type: [MiniTopItemSchema], default: [] },

    signals: {
      confidence: { type: Number, default: 0 },
      completedMiniTests: { type: [String], default: [] },
    },

    finishedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("MiniSuiteResult", MiniSuiteResultSchema);
