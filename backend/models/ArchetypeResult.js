import mongoose from "mongoose";

const ArchetypeResultSchema = new mongoose.Schema(
  {
    // either store a real profile ObjectId, or a string key (or both)
    profileId: { type: mongoose.Schema.Types.ObjectId, required: false, index: true },
    profileKey: { type: String, required: false, index: true },

    testId: { type: String, default: "archetype_main", index: true },

    archetypeId: { type: String, required: true, index: true },
    sphereId: { type: String, required: true },
    familyId: { type: String, required: true },
    matchScore: { type: Number, default: 0 },

    answers: { type: [Number], default: [] },
    userVec: { type: Object, default: {} }
  },
  { timestamps: true }
);

export default mongoose.model("ArchetypeResult", ArchetypeResultSchema);
