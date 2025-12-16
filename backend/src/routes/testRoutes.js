const router = require("express").Router();
const { startTest, submitTest, getProgress, getTestQuestions } = require("../controllers/testController");

router.post("/start", startTest);
router.post("/submit", submitTest);
router.get("/progress/:profileId", getProgress);
router.get("/questions/:testId", getTestQuestions);
router.get("/export/:profileId", exportResults);

module.exports = router;
