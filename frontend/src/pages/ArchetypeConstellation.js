import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";
import { apiGet } from "../api";

export default function ArchetypeConstellation() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");

    apiGet("/api/archetypes?limit=200")
      .then((data) => { if (alive) setItems(data?.items || []); })
      .catch((e) => { if (alive) setErr(e?.message || "Failed to load constellation"); })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, []);

  const grouped = useMemo(() => {
    const map = {};
    for (const a of items) {
      const key = a?.family?.name || a?.family?.id || "Unknown";
      map[key] = map[key] || [];
      map[key].push(a);
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  return (
    <div className="page">
      <div className="container">
        <div className="card">
          <h1 style={{ marginTop: 0 }}>Archetype Constellation</h1>
          <p className="small muted">
            Temporary constellation view (API-backed). We’ll upgrade to nodes/graph next.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn btnGhost" to="/archetype">Archetypes</Link>
            <Link className="btn btnGhost" to="/lore">Lore Library</Link>
            <Link className="btn btnGhost" to="/dashboard">Dashboard</Link>
          </div>

          <hr className="hr" />

          {loading ? <p className="small">Loading…</p> : null}
          {err ? (
            <div className="card" style={{ borderColor: "crimson" }}>
              <b>Couldn’t load constellation.</b>
              <div className="small">{err}</div>
            </div>
          ) : null}

          {grouped.map(([familyName, arr]) => (
            <div key={familyName} className="card" style={{ boxShadow: "none" }}>
              <div style={{ fontWeight: 800 }}>{familyName}</div>
              <div className="small muted">{arr.length} loaded</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {arr.slice(0, 24).map((a) => (
                  <Link key={a.id} className="btn" to={`/lore/${a.id}`}>
                    {a.name}
                  </Link>
                ))}
                {arr.length > 24 ? <span className="small muted">…</span> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
