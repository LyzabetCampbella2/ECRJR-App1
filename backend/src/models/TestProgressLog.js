const mongoose = require("mongoose");

const TestProgressLogSchema = new mongoose.Schema(
  {
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true, index: true },
    event: { type: String, required: true }, // started/submitted/advanced/etc
    testId: { type: String, required: true },
    meta: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TestProgressLog", TestProgressLogSchema);
