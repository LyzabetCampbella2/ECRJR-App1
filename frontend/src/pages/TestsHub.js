import React from "react";
import { Link } from "react-router-dom";

// IMPORTANT: your tests.js exports named exports, not default.
import { TESTS, TEST_LIST } from "../data/tests";

export default function TestsHub() {
  const ids =
    Array.isArray(TEST_LIST) && TEST_LIST.length
      ? TEST_LIST
      : Object.keys(TESTS || {});

  return (
    <div className="container">
      <div className="card">
        <h1 className="h1">Major Test</h1>
        <p className="p">Choose a test to run.</p>

        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {ids.map((id) => {
            const t = TESTS?.[id] || {};
            return (
              <div key={id} className="card" style={{ padding: 14 }}>
                <div style={{ fontWeight: 800 }}>{t.title || t.name || id}</div>
                <div className="p" style={{ marginTop: 8 }}>
                  {t.description || "Run this test."}
                </div>
                <div style={{ marginTop: 10 }}>
                  <Link className="btn btn--primary" to={`/test/${id}`}>Start</Link>
                </div>
              </div>
            );
          })}
        </div>

        {ids.length === 0 && (
          <div style={{ marginTop: 14 }}>
            <p className="p">No tests found. Check src/data/tests.js exports: TESTS / TEST_LIST.</p>
          </div>
        )}
      </div>
    </div>
  );
}
