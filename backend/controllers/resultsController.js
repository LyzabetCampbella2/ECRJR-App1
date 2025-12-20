// backend/controllers/resultsController.js
import MiniSuiteResult from "../models/MiniSuiteResult.js";

export async function getResultsByProfileId(req, res) {
  try {
    const { profileId } = req.params;

    const doc = await MiniSuiteResult.findOne({ profileId });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "No results found for this profileId yet.",
      });
    }

    return res.json({
      success: true,
      profileId,
      suiteStatus: doc.suiteStatus,
      finishedAt: doc.finishedAt,
      totals: doc.totals || {},
      topLuminaries: doc.topLuminaries || [],
      topShadows: doc.topShadows || [],
      submissions: doc.submissions || [],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error loading results",
      error: err?.message || String(err),
    });
  }
}
