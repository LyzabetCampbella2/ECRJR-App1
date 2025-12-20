// backend/models/Profile.js
import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema(
  {
    displayName: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },

    // Orchestrator / progress fields (optional but useful)
    activeTestId: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now }
  },
  { minimize: false }
);

export default mongoose.model("Profile", ProfileSchema);
