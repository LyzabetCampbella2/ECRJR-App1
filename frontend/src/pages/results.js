import { useEffect, useState } from "react";
import { apiGet } from "../api/apiClient";
import ArchetypeCard from "../components/ArchetypeCard";

export default function Results({ profileId }) {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================
     LOAD RESULTS
     ========================= */
  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    apiGet(`/api/tests/results/${profileId}`)
      .then((res) => {
        setResults(res.results || {});
      })
      .catch((e) => {
        setError(e.message || "Failed to load results");
      })
      .finally(() => setLoading(false));
  }, [profileId]);

  /* =========================
     EXPORT RESULTS (JSON)
     ========================= */
  function exportJson() {
    fetch(`http://localhost:5000/api/tests/export/${profileId}`)
      .then((r) => r.json())
      .then((data) => {
        const blob = new Blob(
          [JSON.stringify(data, null, 2)],
          { type: "application/json" }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `eirden-results-${profileId}.json`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        alert("Failed to export results.");
      });
  }

  /* =========================
     GUARD STATES
     ========================= */
  if (loading) {
    return <p style={{ padding: 12 }}>Loading results…</p>;
  }

  if (error) {
    return <p style={{ color: "crimson", padding: 12 }}>{error}</p>;
  }

  if (!profileId) {
    return <p style={{ padding: 12 }}>No profile loaded.</p>;
  }

  const entries = Object.entries(results);

  /* =========================
     RENDER
     ========================= */
  return (
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: 24
      }}
    >
      {/* =========================
          HEADER
         ========================= */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24
        }}
      >
        <h2 style={{ margin: 0 }}>Results</h2>

        {entries.length > 0 && (
          <button onClick={exportJson}>
            Export Results (JSON)
          </button>
        )}
      </div>

      {entries.length === 0 && (
        <p>No results yet. Complete tests to see outcomes.</p>
      )}

      {/* =========================
          RESULTS LIST
         ========================= */}
      {entries.map(([testId, result]) => {
        const loreUrl = `/lore/${encodeURIComponent(result.primary || "Unknown")}`;

        return (
          <div
            key={testId}
            style={{
              border: "1px solid #e2e2e2",
              borderRadius: 16,
              padding: 20,
              marginBottom: 24
            }}
          >
            {/* =========================
                TITLE
               ========================= */}
            <h3
              style={{
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: 8
              }}
            >
              {testId}
            </h3>

            {/* =========================
                ARCHETYPE CARD
               ========================= */}
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <ArchetypeCard result={result} />

              {/* =========================
                  DETAILS
                 ========================= */}
              <div style={{ flex: 1, minWidth: 260 }}>
                <p style={{ fontSize: 18, fontWeight: 600 }}>
                  {result.primary}
                </p>

                {result.secondary && (
                  <p style={{ color: "#666" }}>{result.secondary}</p>
                )}

                {result.overview && (
                  <p style={{ marginTop: 12 }}>{result.overview}</p>
                )}

                <div style={{ marginTop: 12 }}>
                  <a href={loreUrl}>Read Archetype Lore →</a>
                </div>

                {result.flags && result.flags.length > 0 && (
                  <p style={{ color: "darkred", marginTop: 12 }}>
                    <b>Flags:</b> {result.flags.join(", ")}
                  </p>
                )}

                <details style={{ marginTop: 12 }}>
                  <summary style={{ cursor: "pointer" }}>
                    Raw Result Data
                  </summary>
                  <pre
                    style={{
                      background: "#f7f7f7",
                      padding: 12,
                      borderRadius: 8,
                      overflowX: "auto",
                      marginTop: 8
                    }}
                  >
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
