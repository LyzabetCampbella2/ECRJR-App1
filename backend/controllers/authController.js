const User = require("../models/User");

function normalizeUser(u) {
  return {
    userId: String(u._id),
    accessCode: u.accessCode,
    role: u.role,
    label: u.label || "",
    consentedAt: u.consentedAt,
  };
}

// POST /api/auth/code
// body: { accessCode }
exports.loginWithCode = async (req, res) => {
  try {
    let { accessCode } = req.body || {};
    if (!accessCode || typeof accessCode !== "string") {
      return res.status(400).json({ success: false, message: "accessCode required" });
    }

    accessCode = accessCode.trim().toUpperCase();

    // Find or create (pilot friendly)
    let user = await User.findOne({ accessCode });
    if (!user) {
      user = await User.create({ accessCode, role: "tester" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Access code disabled" });
    }

    return res.json({ success: true, user: normalizeUser(user) });
  } catch (err) {
    console.error("loginWithCode error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/auth/consent
// body: { userId }
exports.recordConsent = async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ success: false, message: "userId required" });

    const user = await User.findByIdAndUpdate(
      userId,
      { consentedAt: new Date() },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.json({ success: true, user: normalizeUser(user) });
  } catch (err) {
    console.error("recordConsent error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
