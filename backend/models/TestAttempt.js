// backend/models/TestAttempt.js
import mongoose from "mongoose";
import crypto from "crypto";

const AnswerSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const TestAttemptSchema = new mongoose.Schema(
  {
    // ✅ Keep this because your DB already has a UNIQUE index on attemptId
    attemptId: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomUUID(),
      index: true,
    },

    profileKey: { type: String, required: true, index: true },
    testId: { type: String, required: true, index: true },

    status: { type: String, enum: ["started", "submitted"], default: "started" },

    answers: { type: [AnswerSchema], default: [] },

    totals: { type: mongoose.Schema.Types.Mixed, default: {} },

    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// helpful query pattern
TestAttemptSchema.index({ profileKey: 1, testId: 1, submittedAt: -1 });

export default mongoose.model("TestAttempt", TestAttemptSchema);
