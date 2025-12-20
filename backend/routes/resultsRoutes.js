// backend/routes/resultsRoutes.js
import express from "express";
import { getResultsByProfileId } from "../controllers/resultsController.js";

const router = express.Router();

// GET /api/results/:profileId
router.get("/:profileId", getResultsByProfileId);

export default router;
