// backend/routes/constellationRoutes.js
import express from "express";
import { getConstellation } from "../controllers/constellationController.js";

const router = express.Router();

// GET /api/constellation
router.get("/", getConstellation);

export default router;
