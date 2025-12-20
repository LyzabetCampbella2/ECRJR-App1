import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

export default function ArchetypeDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(`/data/archetypesCatalog.json?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status} loading catalog`);
        const json = await res.json();
        if (!Array.isArray(json)) throw new Error("Catalog JSON is not an array");

        const found = json.find((x) => x?.id === id) || null;
        if (alive) setEntry(found);
      } catch (e) {
        if (alive) setErr(String(e?.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="container">
        <div className="card"><p className="p">Loading…</p></div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="container">
        <div className="card">
          <h1 className="h1">Error</h1>
          <p className="p">{err}</p>
          <div style={{ marginTop: 12 }}>
            <Link className="btn" to="/archetypes">Back</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="container">
        <div className="card">
          <h1 className="h1">Not found</h1>
          <p className="p">No archetype with id: {id}</p>
          <div style={{ marginTop: 12 }}>
            <Link className="btn btn--primary" to="/archetypes">Back to Index</Link>
          </div>
        </div>
      </div>
    );
  }

  const lore = entry.lore || {};
  const tags = entry.tags || [];
  const fam = entry.family || "Unassigned";
  const tier = entry.tier || "Common";

  return (
    <div className="container">
      <div className="card">
        <h1 className="h1">{entry.name || entry.id}</h1>
        <p className="p">{entry.id} • {fam} • {tier}</p>

        {lore.oneLiner ? <p style={{ marginTop: 14, fontWeight: 800 }}>{lore.oneLiner}</p> : null}
        {lore.overview ? <p className="p" style={{ marginTop: 10 }}>{lore.overview}</p> : null}

        {tags.length ? (
          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {tags.slice(0, 12).map((t) => (
              <span key={t} className="btn" style={{ cursor: "default" }}>{t}</span>
            ))}
          </div>
        ) : null}

        <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn" to="/archetypes">Back</Link>
          <Link className="btn btn--primary" to="/tests">Take Major Test</Link>
        </div>
      </div>
    </div>
  );
}
