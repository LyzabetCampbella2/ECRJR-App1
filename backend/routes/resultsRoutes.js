// backend/routes/resultRoutes.js
import express from "express";
import { assembleResults } from "../controllers/resultController.js";

const router = express.Router();

// ✅ Assemble final result from Mini Suite (and later Major Test)
router.get("/assemble", assembleResults);

export default router;
