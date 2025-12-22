// backend/routes/starProfileRoutes.js
import express from "express";
import StarProfile from "../models/StarProfile.js";

const router = express.Router();

// GET /api/star-profile?profileKey=debug_profile
router.get("/", async (req, res) => {
  try {
    const profileKey = (req.query.profileKey || "").trim();
    if (!profileKey) return res.status(400).json({ ok: false, message: "profileKey required" });

    const doc = await StarProfile.findOne({ profileKey }).lean();
    return res.json({ ok: true, profileKey, starName: doc?.starName || "" });
  } catch (e) {
    console.error("star-profile GET error:", e);
    return res.status(500).json({ ok: false, message: "Failed to load star profile" });
  }
});

// POST /api/star-profile  body: { profileKey, starName }
router.post("/", async (req, res) => {
  try {
    const profileKey = (req.body?.profileKey || "").trim();
    const starName = (req.body?.starName || "").trim();

    if (!profileKey) return res.status(400).json({ ok: false, message: "profileKey required" });
    if (starName.length > 48) {
      return res.status(400).json({ ok: false, message: "starName too long (max 48 chars)" });
    }

    const doc = await StarProfile.findOneAndUpdate(
      { profileKey },
      { $set: { starName, updatedAt: new Date() } },
      { upsert: true, new: true }
    ).lean();

    return res.json({ ok: true, profileKey, starName: doc?.starName || "" });
  } catch (e) {
    console.error("star-profile POST error:", e);
    return res.status(500).json({ ok: false, message: "Failed to save star profile" });
  }
});

export default router;
