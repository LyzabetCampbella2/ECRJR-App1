// backend/controllers/profileController.js
import Profile from "../models/Profile.js";

export async function createProfile(req, res) {
  try {
    const { displayName, email } = req.body || {};

    if (!displayName || !email) {
      return res.status(400).json({
        success: false,
        message: "displayName and email are required"
      });
    }

    const profile = await Profile.create({
      displayName: String(displayName).trim(),
      email: String(email).trim().toLowerCase(),
      activeTestId: "" // you can set this later
    });

    return res.json({ success: true, profile });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error creating profile",
      error: err?.message || String(err)
    });
  }
}

export async function getProfileById(req, res) {
  try {
    const { id } = req.params;

    const profile = await Profile.findById(id);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    profile.lastSeenAt = new Date();
    await profile.save();

    return res.json({ success: true, profile });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error fetching profile",
      error: err?.message || String(err)
    });
  }
}

export async function updateProfile(req, res) {
  try {
    const { id } = req.params;
    const patch = req.body || {};

    const allowed = {};
    if (patch.displayName !== undefined) allowed.displayName = String(patch.displayName).trim();
    if (patch.email !== undefined) allowed.email = String(patch.email).trim().toLowerCase();
    if (patch.activeTestId !== undefined) allowed.activeTestId = String(patch.activeTestId);

    allowed.lastSeenAt = new Date();

    const profile = await Profile.findByIdAndUpdate(id, allowed, { new: true });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    return res.json({ success: true, profile });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error updating profile",
      error: err?.message || String(err)
    });
  }
}
