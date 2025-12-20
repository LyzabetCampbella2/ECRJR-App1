import mongoose from "mongoose";

const TestAttemptSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    testId: { type: String, required: true, index: true },
    attemptId: { type: String, required: true, unique: true },

    definitionSnapshot: { type: Object, required: true }, // generated test JSON locked for attempt
    progress: { type: Object, default: {} },

    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("TestAttempt", TestAttemptSchema);
