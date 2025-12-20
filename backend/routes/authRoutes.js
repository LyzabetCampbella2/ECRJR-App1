const express = require("express");
const router = express.Router();

const { loginWithCode, recordConsent } = require("../controllers/authController");

router.get("/health", (req, res) => res.json({ success: true, message: "Auth routes active" }));

router.post("/code", loginWithCode);
router.post("/consent", recordConsent);

module.exports = router;
