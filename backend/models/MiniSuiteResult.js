// backend/models/MiniSuiteResult.js
import mongoose from "mongoose";

const MiniSubmissionSchema = new mongoose.Schema(
  {
    miniTestId: { type: String, required: true },
    answers: { type: [Number], default: [] },
    totals: { type: Object, default: {} }, // tag -> score for this mini test
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MiniSuiteResultSchema = new mongoose.Schema(
  {
    profileId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, unique: true },
    suiteStatus: { type: String, enum: ["in_progress", "finished"], default: "in_progress" },

    // raw submissions
    submissions: { type: [MiniSubmissionSchema], default: [] },

    // aggregate across suite
    totals: { type: Object, default: {} }, // tag -> score

    // derived “top lists”
    topLuminaries: { type: [Object], default: [] }, // [{ tag, score }]
    topShadows: { type: [Object], default: [] },    // [{ tag, score }]

    finishedAt: { type: Date },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("MiniSuiteResult", MiniSuiteResultSchema);
