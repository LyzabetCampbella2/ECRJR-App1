import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function ArchetypePage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [catalog, setCatalog] = useState([]);

  const [q, setQ] = useState("");
  const [family, setFamily] = useState("All");
  const [tier, setTier] = useState("All");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(`/data/archetypesCatalog.json?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status} loading /data/archetypesCatalog.json`);

        const json = await res.json();
        if (!Array.isArray(json)) throw new Error("Catalog JSON is not an array");

        if (alive) setCatalog(json);
      } catch (e) {
        if (alive) setErr(String(e?.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  const families = useMemo(() => {
    const set = new Set();
    for (const a of catalog) if (a?.family) set.add(a.family);
    return ["All", ...Array.from(set).sort()];
  }, [catalog]);

  const tiers = useMemo(() => {
    const set = new Set();
    for (const a of catalog) if (a?.tier) set.add(a.tier);
    return ["All", ...Array.from(set).sort()];
  }, [catalog]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();

    return (catalog || []).filter((a) => {
      if (family !== "All" && (a?.family || "Unassigned") !== family) return false;
      if (tier !== "All" && (a?.tier || "Common") !== tier) return false;

      if (!s) return true;

      const hay = [
        a?.id,
        a?.name,
        a?.family,
        a?.tier,
        ...(a?.tags || []),
        a?.lore?.oneLiner,
        a?.lore?.overview
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(s);
    });
  }, [catalog, q, family, tier]);

  const shown = filtered.slice(0, 160);

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 14 }}>
        <h1 className="h1">Archetypes</h1>

        {loading ? <p className="p">Loading…</p> : null}
        {err ? (
          <div style={{ marginTop: 10 }}>
            <p className="p">Error: {err}</p>
            <p className="p" style={{ marginTop: 6 }}>
              Check: <b>http://localhost:3000/data/archetypesCatalog.json</b>
            </p>
          </div>
        ) : null}

        {!loading && !err ? (
          <p className="p">
            Loaded: <b>{catalog.length}</b> • Showing: <b>{filtered.length}</b>
          </p>
        ) : null}

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 220px 180px", gap: 12 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, id, tags, lore…" />

          <select value={family} onChange={(e) => setFamily(e.target.value)}>
            {families.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>

          <select value={tier} onChange={(e) => setTier(e.target.value)}>
            {tiers.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn" to="/dashboard">Dashboard</Link>
          <Link className="btn btn--primary" to="/tests">Major Test</Link>
        </div>
      </div>

      {!loading && !err && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {shown.map((a) => {
            const title = a?.name || a?.id;
            const blurb =
              a?.lore?.oneLiner ||
              a?.lore?.overview ||
              (a?.tags?.length ? `Tags: ${a.tags.join(", ")}` : "No lore yet.");

            return (
              <div key={a.id} className="card" style={{ padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 900 }}>{title}</div>
                  <div style={{ opacity: 0.75, fontSize: 12 }}>{a.id}</div>
                </div>

                <div className="p" style={{ marginTop: 8 }}>
                  <span style={{ opacity: 0.85 }}>
                    {(a.family || "Unassigned")} • {(a.tier || "Common")}
                  </span>
                </div>

                <div className="p" style={{ marginTop: 8 }}>
                  {String(blurb).slice(0, 160)}
                  {String(blurb).length > 160 ? "…" : ""}
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link className="btn btn--primary" to={`/archetypes/${a.id}`}>Open</Link>
                  {/* Keep legacy route working if you still use /lore/:id anywhere */}
                  <Link className="btn" to={`/lore/${a.id}`}>Lore</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !err && filtered.length === 0 ? (
        <div className="card" style={{ marginTop: 14 }}>
          <h2 style={{ margin: 0 }}>No matches.</h2>
          <p className="p" style={{ marginTop: 6 }}>Try removing filters or searching broader terms.</p>
        </div>
      ) : null}
    </div>
  );
}
