import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../api/apiClient";

const TESTS = [
  { id: "language_v1", label: "Language", realm: "Tongues" },
  { id: "artist_v1", label: "Artist", realm: "Craft" },
  { id: "archetype_v1", label: "Archetype", realm: "Core" },
  { id: "shadow_v1", label: "Shadow", realm: "Depth" },
  { id: "luminary_v1", label: "Luminary", realm: "Light" }
];

function safeArr(x) {
  return Array.isArray(x) ? x : [];
}

export default function Constellation() {
  const profileId = localStorage.getItem("eirden_profile") || "";

  const [progress, setProgress] = useState({ activeTestId: "", completedTestIds: [] });
  const [results, setResults] = useState({}); // { testId: {primary, secondary, overview, flags} }

  const [selectedTestId, setSelectedTestId] = useState("archetype_v1");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedResult = results?.[selectedTestId] || null;

  const completedSet = useMemo(() => new Set(progress.completedTestIds || []), [progress.completedTestIds]);

  async function loadAll() {
    if (!profileId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const p = await apiGet(`/api/tests/progress/${profileId}`);
      setProgress({
        activeTestId: p.activeTestId || "",
        completedTestIds: p.completedTestIds || []
      });

      const r = await apiGet(`/api/tests/results/${profileId}`);
      setResults(r.results || {});

      // Choose default selection:
      // Prefer archetype result if exists, else first completed, else first test
      const hasArchetype = !!(r.results && r.results["archetype_v1"]);
      if (hasArchetype) setSelectedTestId("archetype_v1");
      else if ((p.completedTestIds || []).length > 0) setSelectedTestId(p.completedTestIds[0]);
      else setSelectedTestId("language_v1");
    } catch (e) {
      setError(e.message || "Failed to load constellation");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  function loreUrlFor(primary) {
    return `/lore/${encodeURIComponent(primary || "Unknown")}`;
  }

  if (!profileId) {
    return (
      <div className="container">
        <h2>Constellation</h2>
        <p>No profile loaded yet.</p>
        <a href="/dashboard">Go to Dashboard →</a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <h2>Constellation</h2>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Constellation</h2>
          <p className="muted small">
            Click a node to view its result panel. Open Lore for shareable archetype pages.
          </p>
          <p className="muted small">
            <b>Active:</b> {progress.activeTestId || "None"} • <b>Completed:</b>{" "}
            {(progress.completedTestIds || []).length}/5
          </p>
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <a href="/test">Test Runner →</a>
          <a href="/results">Results →</a>
          <a href="/dashboard">Dashboard →</a>
          <button onClick={loadAll}>Refresh</button>
        </div>
      </div>

      {error && (
        <div className="panel mt-md" style={{ borderColor: "#f1b3b3" }}>
          <b style={{ color: "crimson" }}>Error:</b> {error}
        </div>
      )}

      {/* Node grid */}
      <div className="mt-lg" style={{ display: "grid", gap: 12 }}>
        {TESTS.map((t) => {
          const done = completedSet.has(t.id);
          const isActive = progress.activeTestId === t.id;
          const isSelected = selectedTestId === t.id;
          const r = results?.[t.id];

          const primary = r?.primary || (done ? "Completed" : "Not yet");
          const secondary = r?.secondary || "";

          return (
            <button
              key={t.id}
              onClick={() => setSelectedTestId(t.id)}
              className="panel"
              style={{
                textAlign: "left",
                cursor: "pointer",
                borderColor: isSelected ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.12)",
                background: isSelected ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>
                    {t.label}{" "}
                    <span className="muted small" style={{ fontWeight: 400 }}>
                      • {t.realm}
                    </span>
                  </div>

                  <div className="muted small" style={{ marginTop: 6 }}>
                    {isActive ? <b>Active</b> : done ? <b>Completed</b> : <b>Locked</b>}
                    {" • "}
                    {primary}
                    {secondary ? ` — ${secondary}` : ""}
                  </div>
                </div>

                <div className="muted small" style={{ minWidth: 180, textAlign: "right" }}>
                  {done ? "✓" : "○"} {t.id}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Result panel */}
      <div className="panel mt-lg">
        <h3 style={{ marginTop: 0 }}>Archetype Result Panel</h3>

        {!selectedResult ? (
          <p className="muted">
            No result data found for <b>{selectedTestId}</b> yet. Complete the test to populate this node.
          </p>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>
                  {selectedResult.primary || "Unknown"}
                </div>
                {selectedResult.secondary && (
                  <div className="muted" style={{ marginTop: 4 }}>
                    {selectedResult.secondary}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <a href="/results">Go to Results →</a>
                <a href={loreUrlFor(selectedResult.primary)}>Open Lore →</a>
              </div>
            </div>

            {selectedResult.overview && (
              <p className="mt-md" style={{ whiteSpace: "pre-line" }}>
                {selectedResult.overview}
              </p>
            )}

            {safeArr(selectedResult.flags).length > 0 && (
              <p className="flags">
                <b>Flags:</b> {safeArr(selectedResult.flags).join(", ")}
              </p>
            )}

            <details className="mt-md">
              <summary style={{ cursor: "pointer" }}>Raw JSON</summary>
              <pre>{JSON.stringify(selectedResult, null, 2)}</pre>
            </details>
          </>
        )}
      </div>
    </div>
  );
}
