// backend/routes/testRoutes.js
import express from "express";
import {
  pingTests,
  getTestCatalog,
  getTestById,
  startTest,
  submitTest,
  getTestResult,
  getLatestTestResult,
} from "../controllers/testController.js";

const router = express.Router();

router.get("/ping", pingTests);
router.get("/catalog", getTestCatalog);

router.post("/start", startTest);
router.post("/submit", submitTest);

router.get("/results/latest", getLatestTestResult);
router.get("/results/:resultId", getTestResult);

router.get("/:testId", getTestById);

export default router;
