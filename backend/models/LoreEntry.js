// backend/models/LoreEntry.js
import mongoose from "mongoose";

const PsychologySchema = new mongoose.Schema(
  {
    coreDrive: { type: String, default: "" },
    coreFear: { type: String, default: "" },
    protectiveFunction: { type: String, default: "" },
    attachmentPattern: { type: String, default: "" },
    nervousSystemBias: { type: String, default: "" },
  },
  { _id: false }
);

const SociologySchema = new mongoose.Schema(
  {
    roles: { type: [String], default: [] },
    modernManifestations: { type: [String], default: [] },
    socialReward: { type: String, default: "" },
    socialCost: { type: String, default: "" },
  },
  { _id: false }
);

const AnthropologySchema = new mongoose.Schema(
  {
    historicalEchoes: { type: [String], default: [] },
    mythicParallels: { type: [String], default: [] },
    culturalVariants: { type: [String], default: [] },
  },
  { _id: false }
);

const PedagogySchema = new mongoose.Schema(
  {
    teaches: { type: String, default: "" },
    learnsBestThrough: { type: [String], default: [] },
    integrationPractices: { type: [String], default: [] },
  },
  { _id: false }
);

const DevelopmentSchema = new mongoose.Schema(
  {
    earlyExpression: { type: String, default: "" },
    matureExpression: { type: String, default: "" },
    integratedExpression: { type: String, default: "" },
  },
  { _id: false }
);

const CounterweightsSchema = new mongoose.Schema(
  {
    // luminary
    bestLuminaries: { type: [String], default: [] },
    bestShadowsToWatch: { type: [String], default: [] },

    // shadow
    stabilizingLuminaries: { type: [String], default: [] },
    shadowToWatch: { type: String, default: "" },
  },
  { _id: false }
);

const LoreEntrySchema = new mongoose.Schema(
  {
    /**
     * Stable ID used by frontend routes:
     * /lore/:id and /dossier/:id etc.
     * Examples:
     *  - lumi_evergreen_scholar_1
     *  - shadow_inkbound_dread_44
     *  - arch_gilded_sage_12
     */
    id: { type: String, required: true, unique: true, index: true },

    /**
     * What family this belongs to.
     * (We now support archetypes too.)
     */
    kind: {
      type: String,
      enum: ["luminary", "shadow", "archetype"],
      required: true,
      index: true,
    },

    /**
     * Display content
     */
    name: { type: String, required: true, index: true },
    essence: { type: String, default: "" },
    mantra: { type: String, default: "" },
    shortLore: { type: String, default: "" },
    lore: { type: [String], default: [] },

    gifts: { type: [String], default: [] },
    risks: { type: [String], default: [] },

    /**
     * Mostly used for shadows, but safe for all kinds.
     */
    triggers: { type: [String], default: [] },

    /**
     * Deep lenses
     */
    psychology: { type: PsychologySchema, default: () => ({}) },
    sociology: { type: SociologySchema, default: () => ({}) },
    anthropology: { type: AnthropologySchema, default: () => ({}) },
    pedagogy: { type: PedagogySchema, default: () => ({}) },
    development: { type: DevelopmentSchema, default: () => ({}) },

    /**
     * Cross-links
     */
    counterweights: { type: CounterweightsSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

// Text search for Lore Index search bar
LoreEntrySchema.index({
  name: "text",
  essence: "text",
  shortLore: "text",
  mantra: "text",
});

export default mongoose.model("LoreEntry", LoreEntrySchema);
