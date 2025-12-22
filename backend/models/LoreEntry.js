// backend/models/LoreEntry.js
import mongoose from "mongoose";

const ScienceSectionSchema = new mongoose.Schema(
  {
    summary: { type: String, default: "" },
    concepts: { type: [String], default: [] },
    frameworks: { type: [String], default: [] },
    signals: { type: [String], default: [] },
    risks: { type: [String], default: [] },
    practices: { type: [String], default: [] },
    sources: { type: [String], default: [] },
  },
  { _id: false }
);

const LoreEntrySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["archetype", "luminary", "shadow"], required: true, index: true },
    tag: { type: String, required: true, index: true }, // ✅ REQUIRED for your seed script
    name: { type: String, required: true, index: true },

    tagline: { type: String, default: "" },
    oneLine: { type: String, default: "" },

    lore: { type: String, default: "" },
    symbols: { type: [String], default: [] },
    motifs: { type: [String], default: [] },

    science: {
      psychology: { type: ScienceSectionSchema, default: () => ({}) },
      sociology: { type: ScienceSectionSchema, default: () => ({}) },
      anthropology: { type: ScienceSectionSchema, default: () => ({}) },
      pedagogy: { type: ScienceSectionSchema, default: () => ({}) },
      neuroscience: { type: ScienceSectionSchema, default: () => ({}) },
      philosophy: { type: ScienceSectionSchema, default: () => ({}) },
      communication: { type: ScienceSectionSchema, default: () => ({}) },
      leadership: { type: ScienceSectionSchema, default: () => ({}) },
    },

    version: { type: Number, default: 1 },
    lastEditedBy: { type: String, default: "" },
  },
  { timestamps: true, strict: true }
);

LoreEntrySchema.index({ type: 1, tag: 1 }, { unique: true });

export default mongoose.model("LoreEntry", LoreEntrySchema);
