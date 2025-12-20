// backend/routes/profileRoutes.js
import express from "express";
import { createProfile, getProfileById, updateProfile } from "../controllers/profileController.js";

const router = express.Router();

// POST /api/profiles
router.post("/", createProfile);

// GET /api/profiles/:id
router.get("/:id", getProfileById);

// PUT /api/profiles/:id
router.put("/:id", updateProfile);

export default router;
