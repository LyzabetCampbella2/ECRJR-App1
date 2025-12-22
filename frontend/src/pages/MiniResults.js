import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import "../App.css";

export default function MiniResults() {
  const result = useMemo(() => {
    try {
      const raw = localStorage.getItem("lastMiniSuiteResult_v1") || localStorage.getItem("lastMiniResult_v1");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  return (
    <div className="page">
      <div className="container">
        <div className="card">
          <h1 style={{ marginTop: 0 }}>Mini Results</h1>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn btnGhost" to="/dashboard">Dashboard</Link>
            <Link className="btn btnGhost" to="/lore">Lore Library</Link>
          </div>

          <hr className="hr" />

          {!result ? (
            <div className="card" style={{ boxShadow: "none" }}>
              <b>No saved mini results found.</b>
              <div className="small muted">
                Take a mini test first, then come back here.
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <div className="card" style={{ boxShadow: "none" }}>
                <b>Status</b>
                <div className="small muted">
                  {result.suiteStatus || result.status || "—"}
                </div>
              </div>

              {result.totals ? (
                <div className="card" style={{ boxShadow: "none" }}>
                  <b>Totals</b>
                  <pre className="small" style={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(result.totals, null, 2)}
                  </pre>
                </div>
              ) : null}

              {result.topLuminaries ? (
                <div className="card" style={{ boxShadow: "none" }}>
                  <b>Top Luminaries</b>
                  <pre className="small" style={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(result.topLuminaries, null, 2)}
                  </pre>
                </div>
              ) : null}

              {result.topShadows ? (
                <div className="card" style={{ boxShadow: "none" }}>
                  <b>Top Shadows</b>
                  <pre className="small" style={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(result.topShadows, null, 2)}
                  </pre>
                </div>
              ) : null}

              <div className="card" style={{ boxShadow: "none" }}>
                <b>Next</b>
                <div className="small muted">
                  Next we’ll add backend endpoints for luminary/shadow lore so this page can show full profiles like archetypes.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
