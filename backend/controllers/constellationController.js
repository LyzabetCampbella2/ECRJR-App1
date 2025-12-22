// backend/controllers/constellationController.js
// Minimal, safe "constellation" endpoint that won't crash your frontend.
// Later we can upgrade it to pull real nodes from MongoDB (latest results, luminaries, shadows, etc.)

export async function getConstellation(req, res) {
  try {
    const profileKey = (req.query.profileKey || "").trim() || "default";

    // Placeholder constellation payload (so the UI has something reliable to render)
    // You can replace this later with real data from MiniSuiteResult / ArchetypeResult etc.
    const payload = {
      ok: true,
      profileKey,
      generatedAt: new Date().toISOString(),
      nodes: [
        {
          id: "star_core",
          label: "Core Star",
          type: "star",
          group: "core",
          size: 28,
        },
        {
          id: "lum_visionary",
          label: "Luminary: Visionary",
          type: "luminary",
          group: "luminary",
          size: 18,
        },
        {
          id: "sha_wanderer",
          label: "Shadow: Wanderer",
          type: "shadow",
          group: "shadow",
          size: 18,
        },
      ],
      edges: [
        { from: "star_core", to: "lum_visionary", weight: 1 },
        { from: "star_core", to: "sha_wanderer", weight: 1 },
      ],
      meta: {
        note: "This is a starter endpoint. Next we’ll wire it to real latest results + lore.",
      },
    };

    return res.json(payload);
  } catch (err) {
    console.error("getConstellation error:", err);
    return res.status(500).json({
      ok: false,
      message: "Failed to build constellation",
    });
  }
}
