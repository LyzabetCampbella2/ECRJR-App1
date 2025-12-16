import { useEffect, useState } from "react";
import { apiGet } from "../api/apiClient";

export default function Dashboard({ profile }) {
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================
     LOAD DASHBOARD DATA
     ========================= */
  useEffect(() => {
    if (!profile?._id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    Promise.all([
      apiGet(`/api/tests/progress/${profile._id}`),
      apiGet(`/api/tests/results/${profile._id}`)
    ])
      .then(([progressRes, resultsRes]) => {
        setProgress(progressRes);
        setResults(resultsRes.results || {});
      })
      .catch((e) => {
        setError(e.message || "Failed to load dashboard");
      })
      .finally(() => setLoading(false));
  }, [profile]);

  /* =========================
     GUARD STATES
     ========================= */
  if (loading) {
    return <p style={{ padding: 12 }}>Loading dashboard…</p>;
  }

  if (error) {
    return <p style={{ color: "crimson", padding: 12 }}>{error}</p>;
  }

  if (!profile) {
    return <p style={{ padding: 12 }}>No profile loaded.</p>;
  }

  const completed = progress?.completedTestIds || [];
  const active = progress?.activeTestId;
  const resultEntries = Object.entries(results);

  /* =========================
     RENDER
     ========================= */
  return (
    <div
      style={{
        border: "1px solid #e2e2e2",
        borderRadius: 14,
        padding: 20,
        marginBottom: 32
      }}
    >
      <h2 style={{ marginBottom: 8 }}>Dashboard</h2>

      {/* =========================
          PROFILE SUMMARY
         ========================= */}
      <div style={{ marginBottom: 16 }}>
        <p><b>Name:</b> {profile.displayName}</p>
        <p><b>Profile ID:</b> {profile._id}</p>
        <p>
          <b>Status:</b>{" "}
          {active ? `In Progress (${active})` : "All Tests Completed"}
        </p>
      </div>

      {/* =========================
          PROGRESS
         ========================= */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 6 }}>Progress</h3>

        {completed.length === 0 && (
          <p>No tests completed yet.</p>
        )}

        <ul>
          {completed.map((testId) => (
            <li key={testId}>{testId}</li>
          ))}
        </ul>
      </div>

      {/* =========================
          RESULTS OVERVIEW
         ========================= */}
      <div>
        <h3 style={{ marginBottom: 6 }}>Results Overview</h3>

        {resultEntries.length === 0 && (
          <p>No results yet.</p>
        )}

        {resultEntries.map(([testId, result]) => (
          <div
            key={testId}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              marginBottom: 10
            }}
          >
            <b>{testId}</b>
            <div style={{ marginTop: 4 }}>
              <span style={{ fontWeight: 600 }}>{result.primary}</span>
              {result.secondary && (
                <span style={{ color: "#666" }}>
                  {" "}• {result.secondary}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
