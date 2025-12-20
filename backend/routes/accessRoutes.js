import express from "express";

console.log("✅ LOADED accessRoutes.js");

const router = express.Router();

// Ensure JSON parsing for this router
router.use(express.json({ limit: "1mb" }));

const PILOT_CODES = new Set([
  "EIRDEN-PILOT-A1F9",
  "EIRDEN-PILOT-B7Q2",
  "EIRDEN-PILOT-C9M4",
  "EIRDEN-PILOT-D2X8",
  "EIRDEN-PILOT-E5R1",
  "EIRDEN-PILOT-FOUNDER-01",
]);

router.get("/health", (req, res) => {
  res.json({ success: true, message: "access route healthy" });
});

router.post("/validate", (req, res) => {
  console.log("ACCESS validate body:", req.body);

  const raw = req.body?.code;
  if (!raw) return res.status(400).json({ success: false, message: "Code required" });

  const code = String(raw).trim().toUpperCase();

  if (!PILOT_CODES.has(code)) {
    return res.status(401).json({ success: false, message: "Invalid pilot code" });
  }

  const accessLevel = code.includes("FOUNDER") ? "founder" : "pilot";

  return res.json({ success: true, role: "pilot", accessLevel });
});

export default router;
