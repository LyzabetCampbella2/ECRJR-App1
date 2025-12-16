const router = require("express").Router();
const { profiles, id } = require("../utils/memoryStore");

router.post("/", (req, res) => {
  const { displayName, email } = req.body;
  if (!displayName) {
    return res.status(400).json({ success: false, message: "displayName required" });
  }

  const profileId = id();
  profiles[profileId] = {
    _id: profileId,
    displayName,
    email: email || "",
    activeTestId: "language_v1",
    completedTestIds: []
  };

  res.json({ success: true, profile: profiles[profileId] });
});

router.get("/:id", (req, res) => {
  const profile = profiles[req.params.id];
  if (!profile) {
    return res.status(404).json({ success: false, message: "Profile not found" });
  }
  res.json({ success: true, profile });
});

module.exports = router;
