// backend/models/Archetype.js
import mongoose from "mongoose";

const PageSchema = new mongoose.Schema(
  {
    psychology: { type: Object, default: {} },
    sociology: { type: Object, default: {} },
    anthropology: { type: Object, default: {} },
    pedagogy: { type: Object, default: {} },
    biology: { type: Object, default: {} },
    adjacentSciences: { type: Object, default: {} },
    lore: { type: Object, default: {} },
    integration: { type: Object, default: {} },
    relations: { type: Object, default: {} }
  },
  { _id: false }
);

const ArchetypeSchema = new mongoose.Schema(
  {
    // stable external ID (e.g., arch_001)
    id: { type: String, required: true, unique: true, index: true },

    // compact code (e.g., C-TR-01)
    code: { type: String, default: "", index: true },

    name: { type: String, required: true, index: true },

    sphere: {
      id: { type: String, required: true, index: true },
      name: { type: String, default: "" }
    },

    family: {
      id: { type: String, required: true, index: true },
      name: { type: String, default: "" }
    },

    oneLine: { type: String, default: "" },
    primaryFunction: { type: String, default: "" },
    adaptiveRoleSummary: { type: String, default: "" },

    page: { type: PageSchema, default: {} },

    vector: { type: Object, default: {} },
    tags: { type: [String], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model("Archetype", ArchetypeSchema);
