// backend/routes/miniTestRoutes.js
import express from "express";
import {
  getMiniSuite,
  getMiniTest,
  submitMiniTest,
  getMiniSuiteResults,
  finishMiniSuite
} from "../controllers/miniTestController.js";

const router = express.Router();

router.get("/suite", getMiniSuite);
router.get("/results", getMiniSuiteResults);
router.get("/:miniTestId", getMiniTest);
router.post("/submit", submitMiniTest);
router.post("/finish", finishMiniSuite);

export default router;
