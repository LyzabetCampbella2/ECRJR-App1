const mongoose = require("mongoose");

const TestAssignmentSchema = new mongoose.Schema(
  {
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true, index: true },
    testId: { type: String, required: true },
    status: { type: String, enum: ["assigned", "started", "submitted"], default: "assigned" },
    startedAt: { type: Date },
    submittedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TestAssignment", TestAssignmentSchema);
