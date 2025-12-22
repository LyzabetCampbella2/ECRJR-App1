// backend/routes/resultRoutes.js
import express from "express";
import { assembleResults, latestResults } from "../controllers/resultController.js";

const router = express.Router();

// Assemble finalResult from latest submitted attempts
router.get("/assemble", assembleResults);

// Alias
router.get("/latest", latestResults);

export default router;
