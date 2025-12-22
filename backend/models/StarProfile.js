// backend/models/StarProfile.js
import mongoose from "mongoose";

const StarProfileSchema = new mongoose.Schema(
  {
    profileKey: { type: String, required: true, unique: true, index: true },
    starName: { type: String, default: "" },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("StarProfile", StarProfileSchema);
