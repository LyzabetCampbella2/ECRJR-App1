import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { TESTS } from "../data/tests";
import { getQuestionsForTest } from "../data/questions";

import QuestionRenderer from "../lib/testEngine/QuestionRenderer";

export default function TestRunner() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const test = TESTS?.[testId];

  const questions = useMemo(() => {
    try {
      const qs = getQuestionsForTest(testId) || [];
      return Array.isArray(qs) ? qs : [];
    } catch {
      return [];
    }
  }, [testId]);

  const [answers, setAnswers] = useState({});

  if (!test) {
    return (
      <div className="container">
        <div className="card">
          <h1 className="h1">Test not found</h1>
          <p className="p">No test matches: {testId}</p>
          <Link className="btn" to="/tests">Back to Tests</Link>
        </div>
      </div>
    );
  }

  const total = questions.length;
  const completed = Object.keys(answers).length;

  function setAnswer(qid, val) {
    setAnswers((prev) => ({ ...prev, [qid]: val }));
  }

  function finish() {
    navigate(`/results/${testId}`, {
      state: { testId, answers, questions }
    });
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="h1">{test.title || test.name || testId}</h1>
        <p className="p">{test.description || ""}</p>
        <p className="p" style={{ marginTop: 10 }}>
          Progress: <b>{completed}</b> / <b>{total}</b>
        </p>

        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
          {questions.map((q, idx) => {
            const qid = q.id || q.qid || `q_${idx}`;
            const prompt = q.prompt || q.text || q.question || "Question";

            return (
              <div key={qid} className="card" style={{ padding: 14 }}>
                <div style={{ fontWeight: 800 }}>
                  {idx + 1}. {prompt}
                </div>

                {q.subtext ? <div className="p" style={{ marginTop: 6 }}>{q.subtext}</div> : null}

                <div style={{ marginTop: 10 }}>
                  <QuestionRenderer
                    q={{ ...q, id: qid }}
                    value={answers[qid]}
                    onChange={(val) => setAnswer(qid, val)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {questions.length === 0 && (
          <div style={{ marginTop: 14 }}>
            <p className="p">
              No questions returned for <b>{testId}</b>. That means getQuestionsForTest(testId) returned empty.
            </p>
          </div>
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn" to="/tests">Back</Link>
          <button className="btn btn--primary" type="button" onClick={finish} disabled={total > 0 && completed < Math.min(3, total)}>
            Finish
          </button>
        </div>
      </div>
    </div>
  );
}
