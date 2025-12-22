import express from "express";
import Archetype from "../models/Archetype.js";

const router = express.Router();

// GET /api/archetypes?search=&sphere=&family=&limit=&page=
router.get("/", async (req, res) => {
  try {
    const { search = "", sphere = "", family = "", limit = 50, page = 1 } = req.query;
    const q = {};

    if (sphere) q["sphere.id"] = sphere;
    if (family) q["family.id"] = family;

    if (search) {
      q.$or = [
        { name: new RegExp(search, "i") },
        { code: new RegExp(search, "i") },
        { id: new RegExp(search, "i") },
        { tags: new RegExp(search, "i") }
      ];
    }

    const lim = Math.min(Number(limit) || 50, 200);
    const skip = (Number(page) - 1) * lim;

    const [items, total] = await Promise.all([
      Archetype.find(q)
        .select("id code name sphere family oneLine tags")
        .limit(lim)
        .skip(skip)
        .lean(),
      Archetype.countDocuments(q)
    ]);

    res.json({ items, total, page: Number(page), limit: lim });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to list archetypes" });
  }
});

// GET /api/archetypes/:id
router.get("/:id", async (req, res) => {
  try {
    const doc = await Archetype.findOne({ id: req.params.id }).lean();
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to load archetype" });
  }
});

export default router;
