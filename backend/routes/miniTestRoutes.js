import express from "express";
import { getMiniTestById } from "../controllers/miniTestController.js";

const router = express.Router();

/**
 * GET /api/mini-tests/:miniId
 * Example:
 *   /api/mini-tests/lumishadow_mini_1
 */
router.get("/:miniId", getMiniTestById);

export default router;
