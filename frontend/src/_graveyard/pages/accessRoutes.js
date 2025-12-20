const PILOT_CODES = new Set([
  "EIRDEN-PILOT-A1F9",
  "EIRDEN-PILOT-B7Q2",
  "EIRDEN-PILOT-C9M4",
  "EIRDEN-PILOT-D2X8",
  "EIRDEN-PILOT-E5R1",
  "EIRDEN-PILOT-CORE-7A9F",
  "EIRDEN-PILOT-EXT-9X4R",
  "EIRDEN-PILOT-FOUNDER-01",
]);

router.post("/validate", (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, message: "Code required" });
  }

  const valid = PILOT_CODES.has(code.trim().toUpperCase());

  if (!valid) {
    return res.status(401).json({ success: false, message: "Invalid pilot code" });
  }

  return res.json({
    success: true,
    role: "pilot",
    accessLevel: code.includes("FOUNDER") ? "founder" : "pilot",
  });
});
