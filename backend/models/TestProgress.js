const mongoose = require("mongoose");
const { Schema } = mongoose;

const TestProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },

    activeTestId: { type: String, default: "" },
    expectedTestId: { type: String, default: "" },

    completedTests: { type: [String], default: [] },
    completedCount: { type: Number, default: 0 },

    lastResultId: { type: Schema.Types.ObjectId, ref: "Result", default: null },

    startedAt: { type: Date, default: null },
    lastSubmittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TestProgress", TestProgressSchema);
