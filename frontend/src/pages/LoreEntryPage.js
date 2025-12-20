import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

export default function LoreEntryPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/data/archetypesCatalog.json?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status} loading catalog`);
        const json = await res.json();
        if (!Array.isArray(json)) throw new Error("Catalog JSON is not an array");
        const found = json.find((e) => e.id === id) || null;
        if (alive) setEntry(found);
      } catch (e) {
        if (alive) setError(String(e?.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) return <div className="container"><div className="card"><p className="p">Loading…</p></div></div>;
  if (error) return (
    <div className="container"><div className="card">
      <h1 className="h1">Error</h1><p className="p">{error}</p>
      <Link className="btn" to="/archetypes">Back</Link>
    </div></div>
  );

  if (!entry) return (
    <div className="container"><div className="card">
      <h1 className="h1">Not found</h1><p className="p">No entry for {id}</p>
      <Link className="btn" to="/archetypes">Back</Link>
    </div></div>
  );

  const lore = entry.lore || {};
  return (
    <div className="container">
      <div className="card">
        <h1 className="h1">{entry.name || entry.id}</h1>
        <p className="p" style={{ opacity: 0.75 }}>{entry.id}</p>

        {lore.oneLiner ? <p style={{ fontWeight: 800, marginTop: 12 }}>{lore.oneLiner}</p> : null}
        {lore.overview ? <p className="p" style={{ marginTop: 10 }}>{lore.overview}</p> : null}

        <div style={{ marginTop: 16 }}>
          <Link className="btn" to="/archetypes">← Back</Link>
        </div>
      </div>
    </div>
  );
}
