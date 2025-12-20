import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchArchetypesCatalog } from "../lib/catalogApi";

export default function ArchetypeLore() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [catalog, setCatalog] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchArchetypesCatalog();
        if (alive) setCatalog(data);
      } catch (e) {
        if (alive) setError(String(e?.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;

    return catalog.filter((a) => {
      const hay = [
        a?.id,
        a?.name,
        a?.lore?.oneLiner,
        a?.lore?.overview
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [catalog, query]);

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 14 }}>
        <h1 className="h1">Archetype Lore</h1>

        {loading ? (
          <p className="p">Loading…</p>
        ) : error ? (
          <p className="p">{error}</p>
        ) : (
          <p className="p">Loaded: <b>{catalog.length}</b></p>
        )}

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn" to="/dashboard">Dashboard</Link>
          <Link className="btn" to="/archetypes">Archetypes</Link>
        </div>

        <div style={{ marginTop: 12 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lore…"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(233,238,246,.14)",
              background: "rgba(255,255,255,.04)",
              color: "inherit"
            }}
          />
        </div>
      </div>

      {!loading && !error && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {filtered.slice(0, 120).map((a) => (
            <div key={a.id} className="card" style={{ padding: 14 }}>
              <div style={{ fontWeight: 800 }}>{a?.name && a.name !== a.id ? a.name : a.id}</div>
              <div className="p" style={{ marginTop: 8, opacity: 0.85 }}>
                {(a?.lore?.oneLiner || a?.lore?.overview || "No lore yet.").slice(0, 160)}
              </div>
              <div style={{ marginTop: 10 }}>
                <Link className="btn" to={`/lore/${a.id}`}>Open</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
