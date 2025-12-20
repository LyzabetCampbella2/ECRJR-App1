// src/pages/LumiShadowMiniSuite.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../apiClient";

const MINI_IDS = [
  "lumishadow_mini_1",
  "lumishadow_mini_2",
  "lumishadow_mini_3",
  "lumishadow_mini_4",
  "lumishadow_mini_5"
];

export default function LumiShadowMiniSuite() {
  const nav = useNavigate();
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [testDef, setTestDef] = useState(null);

  // answersByTest[testId] = [{questionId, choiceKey}]
  const [answersByTest, setAnswersByTest] = useState({});

  const testId = MINI_IDS[idx];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await apiGet(`/tests/mini/lumishadow/${testId}`);
        if (!cancelled) setTestDef(data);
      } catch (e) {
        if (!cancelled) setTestDef(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [testId]);

  const currentAnswers = useMemo(() => {
    return answersByTest[testId] || [];
  }, [answersByTest, testId]);

  function setChoice(questionId, choiceKey) {
    setAnswersByTest((prev) => {
      const next = { ...prev };
      const arr = [...(next[testId] || [])];
      const existingIdx = arr.findIndex((a) => a.questionId === questionId);
      if (existingIdx >= 0) arr[existingIdx] = { questionId, choiceKey };
      else arr.push({ questionId, choiceKey });
      next[testId] = arr;
      return next;
    });
  }

  function getSelected(questionId) {
    return (answersByTest[testId] || []).find((a) => a.questionId === questionId)?.choiceKey || null;
  }

  const totalQuestions = testDef?.questions?.length || 0;
  const answeredCount = currentAnswers.length;

  const canContinue = totalQuestions > 0 && answeredCount >= totalQuestions;

  async function finishSuite() {
    // score entire suite
    const payload = { answersByTest };
    const resp = await apiPost("/tests/mini/lumishadow/score", payload);

    // Navigate to your existing Results route.
    // We pass the result via location state so Results can render it instantly.
    nav("/results", { state: { lumiShadowMiniResult: resp.result } });
  }

  function next() {
    if (idx < MINI_IDS.length - 1) setIdx((v) => v + 1);
    else finishSuite();
  }

  function back() {
    if (idx > 0) setIdx((v) => v - 1);
    else nav("/dashboard");
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Loading mini test…</h2>
      </div>
    );
  }

  if (!testDef) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Couldn’t load this mini test.</h2>
        <button onClick={() => nav("/dashboard")}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <button onClick={back}>← Back</button>
        <div style={{ fontWeight: 700 }}>
          Mini Test {idx + 1} / {MINI_IDS.length}
        </div>
        <div style={{ opacity: 0.8 }}>
          Answered {answeredCount}/{totalQuestions}
        </div>
      </div>

      <h1 style={{ marginTop: 18 }}>{testDef.title || testId}</h1>
      {testDef.instructions && <p style={{ opacity: 0.85 }}>{testDef.instructions}</p>}

      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
        {(testDef.questions || []).map((q) => {
          const selected = getSelected(q.id);
          return (
            <div key={q.id} style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>
                {q.prompt}
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {(q.options || []).map((o) => (
                  <button
                    key={o.key}
                    onClick={() => setChoice(q.id, o.key)}
                    style={{
                      textAlign: "left",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: selected === o.key ? "2px solid white" : "1px solid rgba(255,255,255,0.18)",
                      background: selected === o.key ? "rgba(255,255,255,0.08)" : "transparent",
                      cursor: "pointer"
                    }}
                  >
                    <span style={{ fontWeight: 800, marginRight: 10 }}>{o.key}.</span>
                    {o.text}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", gap: 12 }}>
        <button onClick={back}>Back</button>

        <button
          onClick={next}
          disabled={!canContinue}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            cursor: canContinue ? "pointer" : "not-allowed",
            opacity: canContinue ? 1 : 0.5
          }}
        >
          {idx < MINI_IDS.length - 1 ? "Next mini test →" : "Finish & See Results →"}
        </button>
      </div>

      {!canContinue && (
        <p style={{ marginTop: 10, opacity: 0.75 }}>
          Answer all questions to continue.
        </p>
      )}
    </div>
  );
}
