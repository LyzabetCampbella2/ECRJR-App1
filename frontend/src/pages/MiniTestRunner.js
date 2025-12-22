import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMiniTest, scoreMiniSuite } from "../api/miniApi";
import { saveMiniSuiteResult } from "../utils/miniSuiteStore";

const MINI_IDS = [
  "lumishadow_mini_1",
  "lumishadow_mini_2",
  "lumishadow_mini_3",
  "lumishadow_mini_4",
  "lumishadow_mini_5",
];

export default function MiniTestRunner() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [tests, setTests] = useState([]); // [{id, title, questions:[...]}]
  const [testIndex, setTestIndex] = useState(0);
  const [qIndex, setQIndex] = useState(0);

  const [answersByTest, setAnswersByTest] = useState({}); // contract shape
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentTest = tests[testIndex] || null;
  const currentQuestion = currentTest?.questions?.[qIndex] || null;

  const progressLabel = useMemo(() => {
    const t = `${testIndex + 1}/${tests.length || MINI_IDS.length}`;
    const q = currentTest?.questions?.length
      ? `${qIndex + 1}/${currentTest.questions.length}`
      : `0/0`;
    return `Test ${t} • Question ${q}`;
  }, [testIndex, tests.length, qIndex, currentTest]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setErr("");
      setLoading(true);
      try {
        const loaded = [];
        for (const id of MINI_IDS) {
          // backend returns {id,...test}
          const t = await fetchMiniTest(id);
          loaded.push({ id, ...t });
        }
        if (!alive) return;
        setTests(loaded);
      } catch (e) {
        if (!alive) return;
        setErr(String(e?.message || e));
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  function recordAnswer(choiceKey) {
    if (!currentTest || !currentQuestion) return;

    setAnswersByTest((prev) => {
      const next = { ...prev };
      const testId = currentTest.id;
      const arr = Array.isArray(next[testId]) ? [...next[testId]] : [];
      // overwrite if already answered
      const idx = arr.findIndex((a) => a.questionId === currentQuestion.id);
      const ans = { questionId: currentQuestion.id, choiceKey };
      if (idx >= 0) arr[idx] = ans;
      else arr.push(ans);
      next[testId] = arr;
      return next;
    });

    // advance
    const qCount = currentTest.questions?.length || 0;
    const lastQ = qIndex >= qCount - 1;

    if (!lastQ) {
      setQIndex((v) => v + 1);
      return;
    }

    const lastTest = testIndex >= (tests.length - 1);
    if (!lastTest) {
      setTestIndex((v) => v + 1);
      setQIndex(0);
      return;
    }
  }

  async function submitAll() {
    setErr("");
    setIsSubmitting(true);
    try {
      const payload = await scoreMiniSuite(answersByTest);
      saveMiniSuiteResult(payload);
      navigate("/mini/results");
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLastQuestion =
    !!currentTest &&
    (qIndex >= ((currentTest.questions?.length || 0) - 1)) &&
    (testIndex >= ((tests.length || 0) - 1));

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <h1 style={{ marginTop: 0 }}>Mini Suite</h1>
          <p style={{ opacity: 0.75 }}>Loading mini tests…</p>
        </div>
      </div>
    );
  }

  if (err && !currentTest) {
    return (
      <div className="page">
        <div className="card">
          <h1 style={{ marginTop: 0 }}>Mini Suite</h1>
          <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.08)" }}>
            <b>Error:</b> {err}
          </div>
          <div style={{ marginTop: 12 }}>
            <button className="secondary" onClick={() => navigate("/mini")}>Back</button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentTest || !currentQuestion) {
    return (
      <div className="page">
        <div className="card">
          <h1 style={{ marginTop: 0 }}>Mini Suite</h1>
          <p style={{ opacity: 0.75 }}>No questions found.</p>
          <button className="secondary" onClick={() => navigate("/mini")}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Mini Suite Runner</h1>
        <div style={{ fontSize: 12, opacity: 0.7 }}>{progressLabel}</div>

        <div style={{ marginTop: 14, padding: 14, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)", background: "rgba(255,255,255,0.75)" }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>{currentQuestion.prompt || currentQuestion.text || "Question"}</div>
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {(currentQuestion.options || []).map((opt) => (
              <button
                key={opt.key}
                className="secondary"
                onClick={() => {
                  // If last question of last test, we still record answer then show submit button.
                  recordAnswer(opt.key);
                }}
                style={{ textAlign: "left", padding: "12px 12px" }}
              >
                <b style={{ marginRight: 8 }}>{opt.key}.</b> {opt.label || opt.text || "Option"}
              </button>
            ))}
          </div>
        </div>

        {err ? (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.08)" }}>
            <b>Error:</b> {err}
          </div>
        ) : null}

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="secondary" onClick={() => navigate("/mini")}>
            Exit
          </button>

          {isLastQuestion ? (
            <button className="primary" disabled={isSubmitting} onClick={submitAll}>
              {isSubmitting ? "Scoring..." : "Finish + Score →"}
            </button>
          ) : (
            <div style={{ fontSize: 12, opacity: 0.7, alignSelf: "center" }}>
              Choose an option to continue
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
