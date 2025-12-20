import React, { useMemo } from "react";
import { Link } from "react-router-dom";

export default function Results() {
  const data = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("lastTestResult") || "null");
    } catch {
      return null;
    }
  }, []);

  const testId = localStorage.getItem("lastTestId") || "";

  // Expecting something like:
  // data.topArchetypes / topLuminaries / topShadows arrays -> [{ id, tag, name, score }]
  const topA = data?.topArchetypes || data?.archetypes || [];
  const topL = data?.topLuminaries || data?.luminaries || [];
  const topS = data?.topShadows || data?.shadows || [];

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <Link className="btn" to="/dashboard">Dashboard</Link>
        <Link className="btn" to="/tests">Tests Hub</Link>
        <Link className="btn" to="/catalog">Catalog</Link>
      </div>

      <h1 style={{ marginTop: 0 }}>Results</h1>
      <p style={{ color: "rgba(0,0,0,0.65)" }}>
        Last test: <code>{testId || "none"}</code>
      </p>

      {!data ? (
        <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 18, padding: 16 }}>
          <p style={{ margin: 0, color: "rgba(0,0,0,0.70)" }}>
            No stored result yet. Take a test first.
          </p>
          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn" to="/tests">Go to Tests Hub</Link>
            <Link className="btn" to="/mini">Mini Suite</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          <Block title="Top Archetypes">
            <List rows={topA} basePath="/archetypes" />
          </Block>

          <Block title="Top Luminaries">
            <List rows={topL} basePath="/luminaries" />
          </Block>

          <Block title="Top Shadows">
            <List rows={topS} basePath="/shadows" />
          </Block>

          <Block title="Raw Payload">
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </Block>
        </div>
      )}
    </div>
  );
}

function Block({ title, children }) {
  return (
    <section style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 18, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </section>
  );
}

function List({ rows, basePath }) {
  const safe = Array.isArray(rows) ? rows : [];
  if (safe.length === 0) return <div style={{ color: "rgba(0,0,0,0.65)" }}>No entries returned.</div>;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {safe.slice(0, 10).map((r, i) => {
        const id = r.id || r.tag || r.slug || `item-${i}`;
        const name = r.name || r.label || r.tag || id;
        const score = r.score ?? r.value ?? null;

        return (
          <div key={id} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Link className="btn" to={`${basePath}/${id}`}>Open</Link>
            <div style={{ fontWeight: 650 }}>{name}</div>
            {score !== null ? (
              <div style={{ color: "rgba(0,0,0,0.65)" }}>score: {score}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
