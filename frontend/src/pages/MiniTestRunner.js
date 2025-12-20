import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPost } from "../apiClient";

/**
 * MiniTestRunner
 * Route: /mini-tests/:miniTestId
 *
 * Backend endpoints expected:
 *  - GET  /api/mini-tests/:miniTestId
 *     -> { success:true, test:{ id,title,intro,questions:[{id,prompt,options:[{value,label}]}] } }
 *     OR on lock (gating):
 *     -> { success:false, expectedMiniTestId:"mini_2", ... }
 *
 *  - POST /api/mini-tests/:miniTestId/submit
 *     Body: { testId: "mini_1", answers:[{questionId,value}] }
 *     -> { success:true, result:{luminaryId,shadowId,confidence,explain,scores}, progress:{...} }
 */
export default function MiniTestRunner() {
  const { miniTestId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [test, setTest] = useState(null);
  const [error, setError] = useState("");

  // answers: { [questionId]: optionValue }
  const [answers, setAnswers] = useState({});

  const questions = useMemo(() => test?.questions || [], [test]);

  const answeredCount = useMemo(() => {
    return Object.keys(answers || {}).filter((k) => !!answers[k]).length;
  }, [answers]);

  const progressText = useMemo(() => {
    const total = questions.length || 0;
    return `${answeredCount}/${total}`;
  }, [answeredCount, questions.length]);

  useEffect(() => {
    let mounted = true;

    async function loadMiniTest() {
      if (!miniTestId) return;

      setLoading(true);
      setError("");
      setTest(null);
      setAnswers({});

      try {
        const res = await apiGet(`/api/mini-tests/${miniTestId}`);

        // ✅ D) Gating redirect (backend can return expectedMiniTestId)
        if (res?.success === false && res?.expectedMiniTestId) {
          navigate(`/mini-tests/${res.expectedMiniTestId}`, { replace: true });
          return;
        }

        if (!mounted) return;

        if (!res?.success) {
          setError(res?.message || "Failed to load mini test.");
          setLoading(false);
          return;
        }

        // tolerate different shapes, but prefer res.test
        const t = res.test || res.data?.test || res.data || res.miniTest;

        if (!t?.questions || !Array.isArray(t.questions) || t.questions.length === 0) {
          setError("Mini test loaded, but no questions were found.");
          setLoading(false);
          return;
        }

        setTest(t);
        setLoading(false);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Error loading mini test.");
        setLoading(false);
      }
    }

    loadMiniTest();

    return () => {
      mounted = false;
    };
  }, [miniTestId, navigate]);

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...(prev || {}), [questionId]: value }));
  }

  function missingQuestionIds() {
    return questions
      .filter((q) => !answers?.[q.id])
      .map((q) => q.id);
  }

  function buildSubmitPayload() {
    // backend-safe: array of {questionId, value} in question order
    return {
      testId: miniTestId,
      answers: questions.map((q) => ({
        questionId: q.id,
        value: answers?.[q.id] ?? null,
      })),
    };
  }

  async function handleSubmit() {
    setError("");

    const missing = missingQuestionIds();
    if (missing.length > 0) {
      setError(`Please answer all questions (${missing.length} missing).`);
      return;
    }

    setSubmitting(true);

    try {
      const payload = buildSubmitPayload();
      const res = await apiPost(`/api/mini-tests/${miniTestId}/submit`, payload);

      // ✅ D) If backend blocks out-of-order submit, redirect to expected
      if (res?.success === false && res?.expectedMiniTestId) {
        navigate(`/mini-tests/${res.expectedMiniTestId}`, { replace: true });
        return;
      }

      if (!res?.success) {
        setError(res?.message || "Failed to submit mini test.");
        setSubmitting(false);
        return;
      }

      // store per-mini result locally so MiniResults can read it
      const result = res.result || res.data?.result || res.data || null;
      if (result) {
        localStorage.setItem(`miniTestResult:${miniTestId}`, JSON.stringify(result));
      }

      // optional: store progress too
      const progress = res.progress || res.data?.progress || null;
      if (progress) {
        localStorage.setItem("miniTestsProgress:last", JSON.stringify(progress));
      }

      // back to dashboard
      navigate("/dashboard", { state: { miniTestCompleted: miniTestId } });
    } catch (e) {
      setError(e?.message || "Error submitting mini test.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.h1}>Loading mini test…</div>
          <div style={styles.p}>ID: {miniTestId}</div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.h1}>Mini Test Error</div>
          <div style={{ ...styles.p, color: "#ffb4c0" }}>
            {error || "Mini test could not be loaded."}
          </div>

          <div style={styles.actions}>
            <button style={styles.secondaryBtn} onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </button>
            <button style={styles.primaryBtn} onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.topRow}>
          <div>
            <div style={styles.h1}>{test.title || "Mini Test"}</div>
            {test.intro ? <div style={styles.p}>{test.intro}</div> : null}
          </div>

          <div style={styles.progressBox}>
            <div style={styles.progressLabel}>Progress</div>
            <div style={styles.progressValue}>{progressText}</div>
          </div>
        </div>

        {error ? (
          <div style={styles.errorBox}>
            <div style={styles.errorText}>{error}</div>
          </div>
        ) : null}

        <div style={{ marginTop: 16 }}>
          {questions.map((q, idx) => (
            <div key={q.id} style={styles.qCard}>
              <div style={styles.qTitle}>
                {idx + 1}. {q.prompt}
              </div>

              <div style={styles.options}>
                {(q.options || []).map((opt) => {
                  const checked = answers?.[q.id] === opt.value;

                  return (
                    <label key={opt.value} style={styles.optionRow}>
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.value}
                        checked={checked}
                        onChange={() => setAnswer(q.id, opt.value)}
                        disabled={submitting}
                      />
                      <span style={styles.optionLabel}>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.actions}>
          <button
            style={styles.secondaryBtn}
            onClick={() => navigate("/dashboard")}
            disabled={submitting}
          >
            Back
          </button>

          <button
            style={{
              ...styles.primaryBtn,
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit Mini Test"}
          </button>
        </div>

        <div style={{ marginTop: 10, opacity: 0.8, fontSize: 12 }}>
          Tip: If a mini test is locked, the app will auto-redirect you to the correct next test.
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    padding: 18,
    background: "#0f1115",
    color: "#eaeef6",
  },
  card: {
    width: "min(920px, 100%)",
    background: "#151a22",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },
  h1: { fontSize: 22, fontWeight: 900, marginBottom: 6 },
  p: { opacity: 0.85, lineHeight: 1.4 },
  progressBox: {
    minWidth: 120,
    borderRadius: 12,
    padding: 12,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    textAlign: "right",
  },
  progressLabel: { fontSize: 12, opacity: 0.75 },
  progressValue: { fontSize: 18, fontWeight: 900, marginTop: 4 },
  qCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  qTitle: { fontWeight: 800, marginBottom: 10 },
  options: { display: "grid", gap: 10 },
  optionRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 12,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  optionLabel: { opacity: 0.92 },
  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    background: "rgba(176,0,32,0.12)",
    border: "1px solid rgba(176,0,32,0.35)",
  },
  errorText: { color: "#ffb4c0" },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
    flexWrap: "wrap",
  },
  primaryBtn: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "none",
    fontWeight: 900,
    background: "#3a7afe",
    color: "white",
  },
  secondaryBtn: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    fontWeight: 800,
    background: "transparent",
    color: "#eaeef6",
  },
};
