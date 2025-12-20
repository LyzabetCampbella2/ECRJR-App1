import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * Minimal Shadow Test page (non-flicker navigation).
 * Expected endpoints (adjust if yours differ):
 * GET  /api/tests/shadow_v1
 * POST /api/tests/submit
 */
export default function ShadowTest() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [testId] = useState("shadow_v1");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/tests/${testId}`);
        if (!res.ok) throw new Error(`Failed to load ${testId} (${res.status})`);

        const data = await res.json();
        const qs = data.questions || data.items || data || [];

        if (!cancelled) {
          setQuestions(Array.isArray(qs) ? qs : []);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            "Shadow test questions could not load. If you haven't added the backend route yet, add it first, then refresh."
          );
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [testId]);

  function setAnswer(qid, value) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        testId,
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          value,
        })),
      };

      const res = await fetch("/api/tests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Submit failed.");
      }

      if (data?.redirectTo) {
        navigate(data.redirectTo);
        return;
      }

      navigate("/results");
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <Link className="btn" to="/tests">← Back</Link>
        <Link className="btn" to="/dashboard">Dashboard</Link>
      </div>

      <h1 style={{ marginTop: 0 }}>Shadow Test</h1>
      <p style={{ color: "rgba(0,0,0,0.65)" }}>
        Test ID: <code>{testId}</code>
      </p>

      {loading ? <div>Loading…</div> : null}
      {error ? (
        <div style={{ padding: 12, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12 }}>
          {error}
        </div>
      ) : null}

      {!loading && !error && questions.length === 0 ? (
        <div style={{ padding: 12, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12 }}>
          No questions found for this test yet.
        </div>
      ) : null}

      {!loading && !error && questions.length > 0 ? (
        <>
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {questions.map((q, idx) => {
              const qid = q.id || q._id || `q${idx}`;
              const prompt = q.prompt || q.question || q.text || `Question ${idx + 1}`;
              const scale = q.scale || [1, 2, 3, 4, 5];

              return (
                <div
                  key={qid}
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 16,
                    padding: 14,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 10 }}>
                    {idx + 1}. {prompt}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {scale.map((n) => (
                      <button
                        key={n}
                        type="button"
                        className="btn"
                        onClick={() => setAnswer(qid, n)}
                        style={{
                          background:
                            answers[qid] === n ? "rgba(0,0,0,0.10)" : "rgba(0,0,0,0.03)",
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 16 }}>
            <button className="btn" type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Shadow Test"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
