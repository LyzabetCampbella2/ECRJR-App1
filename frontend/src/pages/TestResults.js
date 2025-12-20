import React, { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { scoreMajorTest } from "../lib/testEngine/scoreMajorTest";

export default function TestResults() {
  const { testId } = useParams();
  const location = useLocation();

  const state = location.state || {};
  const answers = state.answers || {};
  const questions = state.questions || [];

  const result = useMemo(() => {
    return scoreMajorTest(questions, answers);
  }, [questions, answers]);

  const top = result?.topArchetypes || [];

  return (
    <div className="container">
      <div className="card">
        <h1 className="h1">Results</h1>
        <p className="p">Test: <b>{testId}</b></p>

        {!questions.length ? (
          <div style={{ marginTop: 14 }}>
            <p className="p">
              No result data found (likely you refreshed). Run the test again so results can compute.
            </p>
            <div style={{ marginTop: 12 }}>
              <Link className="btn btn--primary" to={`/test/${testId}`}>Re-run Test</Link>
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginTop: 14 }}>
              <h2 style={{ margin: "0 0 10px" }}>Top Archetypes</h2>
              {top.length === 0 ? (
                <p className="p">
                  No archetype scoring found yet. Add scoring maps to your questions (q.scoring or option.scores).
                </p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                  {top.map((a) => (
                    <div key={a.id} className="card" style={{ padding: 14 }}>
                      <div style={{ fontWeight: 800 }}>{a.id}</div>
                      <div className="p" style={{ marginTop: 8 }}>Score: <b>{a.score}</b></div>
                      <div style={{ marginTop: 10 }}>
                        {/* Your current detail page is /lore/:id */}
                        <Link className="btn btn--primary" to={`/lore/${a.id}`}>Open</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link className="btn" to="/tests">Back to Tests</Link>
              <Link className="btn" to={`/test/${testId}`}>Re-run</Link>
              <Link className="btn btn--primary" to="/archetypes">Browse Archetypes</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
