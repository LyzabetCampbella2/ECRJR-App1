// src/pages/ArtistTest.js
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { apiGet } from "../apiClient";

export default function ArtistTest() {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const attemptId = params.get("attemptId");
  const dayParam = params.get("day");

  const [attempt, setAttempt] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setErr("");
        if (!attemptId) {
          setAttempt(null);
          setLoading(false);
          return;
        }

        setLoading(true);
        const res = await apiGet(`/api/tests/attempt/${attemptId}`);
        if (!res?.success) throw new Error(res?.message || "Failed to load attempt.");
        if (!alive) return;
        setAttempt(res);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Failed to load test.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [attemptId]);

  if (!attemptId) {
    return (
      <div style={{ padding: 28, maxWidth: 900, margin: "0 auto" }}>
        <h1>Artist Test</h1>
        <p style={{ color: "crimson" }}>
          Missing <code>?attemptId=</code> in the URL.
        </p>
        <Link to="/dashboard" style={{ textDecoration: "underline" }}>
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 28 }}>Loading test…</div>;
  if (err) return <div style={{ padding: 28, color: "crimson" }}>{err}</div>;
  if (!attempt) return <div style={{ padding: 28 }}>No attempt loaded.</div>;

  const currentDay = attempt?.progress?.day || 1;
  const completedAt = attempt?.progress?.completedAt || null;
  const dayShown = dayParam ? Number(dayParam) : currentDay;

  return (
    <div style={{ padding: 28, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 10 }}>
        <Link to="/dashboard" style={{ textDecoration: "underline" }}>
          ← Dashboard
        </Link>
      </div>

      <h1 style={{ marginTop: 0 }}>Artist Test</h1>

      <div style={{ padding: 14, border: "1px solid #ddd", borderRadius: 12 }}>
        <div style={{ fontFamily: "monospace", opacity: 0.85 }}>
          attemptId: {attemptId}
        </div>
        <div style={{ marginTop: 6 }}>
          <strong>Current day:</strong> {currentDay}
        </div>
        <div>
          <strong>Viewing day:</strong> {dayShown}
        </div>

        {completedAt ? (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontWeight: 800 }}>Completed ✅</div>
            <Link to={`/results/${attemptId}`} style={{ textDecoration: "underline" }}>
              View Results →
            </Link>
          </div>
        ) : (
          <div style={{ marginTop: 10, opacity: 0.85 }}>
            (Next: wire this page to render day questions + submit day from UI.)
          </div>
        )}
      </div>
    </div>
  );
}
