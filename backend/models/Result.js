// backend/models/Result.js
const mongoose = require("mongoose");

const { Schema } = mongoose;

/**
 * Result
 * Stores the finalized output of a completed test run for a user.
 * IMPORTANT: This file must ONLY define the schema/model.
 * No Express router code belongs here.
 */
const ResultSchema = new Schema(
  {
    // Who this result belongs to
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Which test generated this result (e.g., "archetype_v1", "shadow_v1")
    testId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // Primary classification of result output
    resultType: {
      type: String,
      enum: ["primary", "shadow", "luminary"],
      default: "primary",
      index: true,
    },

    // Human-readable label fields for UI
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    overview: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    // Optional structured arrays for UI rendering
    traits: {
      type: [String],
      default: [],
    },

    // Optional numeric / categorical scores
    // (Example: { A: 7, C: 3, "resonance": 0.82 })
    scores: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // Optional: what test should unlock next (frontend can use this)
    nextUnlocked: {
      type: String,
      trim: true,
      default: "",
    },

    // Optional: store raw computed payload (keep it safe/lean)
    // (Example: narrative blocks, sectioned copy, internal tags)
    payload: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

// Prevent duplicates for same user + test run type (tune if you allow retakes)
ResultSchema.index({ userId: 1, testId: 1, resultType: 1, createdAt: -1 });

// Export model
module.exports = mongoose.model("Result", ResultSchema);
