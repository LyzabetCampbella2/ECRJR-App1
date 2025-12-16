import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../api/apiClient";

const TEST_ORDER = ["language_v1", "artist_v1", "archetype_v1", "shadow_v1", "luminary_v1"];

export default function Test() {
  const profileId = localStorage.getItem("eirden_profile") || "";

  const [progress, setProgress] = useState({ activeTestId: "", completedTestIds: [] });
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { [questionId]: selectedOption }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const activeTestId = progress.activeTestId || "";

  const completedCount = progress.completedTestIds?.length || 0;

  const activeLabel = useMemo(() => {
    if (!activeTestId) return "";
    const idx = TEST_ORDER.indexOf(activeTestId);
    const n = idx >= 0 ? idx + 1 : "?";
    return `Test ${n}/5: ${activeTestId}`;
  }, [activeTestId]);

  async function loadProgressAndQuestions() {
    if (!profileId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const p = await apiGet(`/api/tests/progress/${profileId}`);
      const nextActive = p.activeTestId || "";
      setProgress({
        activeTestId: nextActive,
        completedTestIds: p.completedTestIds || []
      });

      if (!nextActive) {
        setQuestions([]);
        setAnswers({});
        setLoading(false);
        return;
      }

      const q = await apiGet(`/api/tests/questions/${nextActive}`);
      setQuestions(q.questions || []);
      setAnswers({});
    } catch (e) {
      setError(e.message || "Failed to load test");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProgressAndQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  function setAnswer(qid, option) {
    setAnswers((prev) => ({ ...prev, [qid]: option }));
  }

  function allAnswered() {
    if (!questions.length) return false;
    return questions.every((q) => answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== "");
  }

  async function submit() {
    if (!profileId) {
      setError("No profile found. Go to Dashboard and create one.");
      return;
    }
    if (!activeTestId) {
      setError("No active test. Start a test from Dashboard.");
      return;
    }
    if (!allAnswered()) {
      setError("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      // Convert answers map -> array (stable order by questions)
      const answersArray = questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id]
      }));

      const res = await apiPost("/api/tests/submit", {
        profileId,
        testId: activeTestId,
        answers: answersArray
      });

      setNotice(res.message ? `${res.message} ✅` : "Submitted ✅");

      // Reload progress & next questions
      await loadProgressAndQuestions();

      // Optional UX: if finished all tests, send user to results
      // (We won’t auto-redirect; user can click Results)
    } catch (e) {
      setError(e.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!profileId) {
    return (
      <div className="container">
        <h2>Test</h2>
        <p>No profile found on this device.</p>
        <a href="/dashboard">Go to Dashboard →</a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <h2>Test</h2>
        <p>Loading…</p>
      </div>
    );
  }

  // No active test means either none started or all completed
  if (!activeTestId) {
    return (
      <div className="container">
        <h2>Test</h2>
        <p className="muted small">
          Completed: <b>{completedCount}/5</b>
        </p>

        {completedCount >= 5 ? (
          <>
            <p>All tests completed ✅</p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <a href="/results">View Results →</a>
              <a href="/constellation">View Constellation →</a>
              <a href="/dashboard">Back to Dashboard →</a>
            </div>
          </>
        ) : (
          <>
            <p>No active test yet. Start one from the Dashboard.</p>
            <a href="/dashboard">Go to Dashboard →</a>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Test</h2>
          <p className="muted small">{activeLabel}</p>
          <p className="muted small">
            Completed: <b>{completedCount}/5</b>
          </p>
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <a href="/dashboard">Dashboard →</a>
          <a href="/results">Results →</a>
          <a href="/constellation">Constellation →</a>
        </div>
      </div>

      {notice && (
        <div className="panel mt-md" style={{ borderColor: "#cde8d0" }}>
          <b>✅ {notice}</b>
        </div>
      )}

      {error && (
        <div className="panel mt-md" style={{ borderColor: "#f1b3b3" }}>
          <b style={{ color: "crimson" }}>Error:</b> {error}
        </div>
      )}

      <div className="mt-lg">
        {questions.length === 0 ? (
          <div className="panel">
            <p>No questions returned for this test.</p>
            <p className="muted small">Try refreshing progress.</p>
            <button onClick={loadProgressAndQuestions} disabled={submitting}>
              Refresh
            </button>
          </div>
        ) : (
          questions.map((q) => (
            <div key={q.id} className="results-block">
              <div className="results-title">{q.text}</div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {(q.options || []).map((opt) => {
                  const selected = answers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setAnswer(q.id, opt)}
                      style={{
                        fontWeight: selected ? 700 : 400,
                        opacity: selected ? 1 : 0.9
                      }}
                      type="button"
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-lg" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={submit} disabled={submitting || questions.length === 0}>
          {submitting ? "Submitting…" : "Submit Answers"}
        </button>

        <button onClick={loadProgressAndQuestions} disabled={submitting}>
          Refresh Test
        </button>
      </div>

      {!allAnswered() && questions.length > 0 && (
        <p className="muted small mt-md">Answer all questions to enable a clean submit.</p>
      )}
    </div>
  );
}
