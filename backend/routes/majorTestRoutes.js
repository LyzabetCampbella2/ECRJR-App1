// backend/routes/majorTestRoutes.js
import express from "express";
import { getMajorTestBank, submitMajorTest } from "../controllers/majorTestController.js";

const router = express.Router();

// base: /api/major-test
router.get("/bank", getMajorTestBank);
router.post("/submit", submitMajorTest);

export default router;
