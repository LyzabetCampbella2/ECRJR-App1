// backend/models/User.js
// ============================================================================
// User Model (ESM) — FULL + UPDATED for Eirden
// - Fixes ESM import compatibility (export default)
// - Keeps your existing fields (accessCode, role, label, consentedAt, isActive)
// - Adds mini test storage + completion tracking
// - Adds constellation + constellationHistory (snapshots)
// ============================================================================

import mongoose from "mongoose";

const { Schema } = mongoose;

const ConstellationEntrySchema = new Schema(
  {
    id: { type: String, required: true }, // e.g. "lumi_001" or "shad_002"
    score: { type: Number, default: 0 },
  },
  { _id: false }
);

const ConstellationSnapshotSchema = new Schema(
  {
    snapshotAt: { type: Date, default: Date.now },
    sourceTestId: { type: String, default: "" },

    luminaries: { type: [ConstellationEntrySchema], default: [] },
    shadows: { type: [ConstellationEntrySchema], default: [] },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    // ------------------------------------------------------------------------
    // Access & role
    // ------------------------------------------------------------------------
    accessCode: { type: String, required: true, unique: true, index: true },
    role: { type: String, enum: ["tester", "admin"], default: "tester" },

    // ------------------------------------------------------------------------
    // Optional (pilot-friendly fields)
    // ------------------------------------------------------------------------
    label: { type: String, default: "" }, // e.g. "Tester 07"
    consentedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },

    // ------------------------------------------------------------------------
    // Mini test tracking
    // ------------------------------------------------------------------------
    miniTestsCompleted: { type: [String], default: [] },

    // Holds per-test result objects. Example:
    // miniTestResults["lumi_shadow_v1"] = { raw, totals, top, savedAt }
    miniTestResults: { type: Schema.Types.Mixed, default: {} },

    // ------------------------------------------------------------------------
    // Constellation (current)
    // ------------------------------------------------------------------------
    constellation: {
      luminaries: { type: [ConstellationEntrySchema], default: [] },
      shadows: { type: [ConstellationEntrySchema], default: [] },
    },

    // ------------------------------------------------------------------------
    // Constellation history (snapshots)
    // ------------------------------------------------------------------------
    constellationHistory: { type: [ConstellationSnapshotSchema], default: [] },
  },
  { timestamps: true }
);

// Avoid OverwriteModelError in dev/hot reload
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
