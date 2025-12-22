import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

export default function LoreIndexPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [canonLevel, setCanonLevel] = useState("");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (type) params.set("type", type);
      if (canonLevel) params.set("canonLevel", canonLevel);
      if (tag) params.set("tag", tag);

      const res = await fetch(`/api/lore?${params.toString()}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "Failed to load lore");
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setErr(e.message || "Failed to load");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allTypes = useMemo(() => uniq(items.map((x) => x.type)).sort(), [items]);
  const allTags = useMemo(() => uniq(items.flatMap((x) => x.tags || [])).sort(), [items]);

  return (
    <div style={styles.wrap}>
      <div style={styles.top}>
        <div>
          <h1 style={styles.h1}>Lore Library</h1>
          <div style={styles.sub}>Search canon entries and open the full record.</div>
        </div>
        <button onClick={load} style={styles.btn} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div style={styles.filters}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search (title, tags, body, linked archetypes, nodes)…"
          style={styles.input}
        />

        <select value={type} onChange={(e) => setType(e.target.value)} style={styles.select}>
          <option value="">All types</option>
          {allTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select value={canonLevel} onChange={(e) => setCanonLevel(e.target.value)} style={styles.select}>
          <option value="">All canon tiers</option>
          <option value="primary">primary</option>
          <option value="secondary">secondary</option>
          <option value="speculative">speculative</option>
        </select>

        <select value={tag} onChange={(e) => setTag(e.target.value)} style={styles.select}>
          <option value="">All tags</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <button onClick={load} style={styles.btnWide} disabled={loading}>
          Apply
        </button>
      </div>

      {err ? <div style={styles.err}>⚠ {err}</div> : null}

      <div style={styles.list}>
        {items.map((x) => (
          <Link key={x.id} to={`/codex/lore/${x.id}`} style={styles.card}>
            <div style={styles.cardTop}>
              <div style={styles.title}>{x.title}</div>
              <div style={styles.meta}>
                <span style={styles.pill}>{x.type}</span>
                <span style={styles.pill}>{x.canonLevel}</span>
                {x.updatedAt ? <span style={styles.date}>{x.updatedAt}</span> : null}
              </div>
            </div>
            <div style={styles.summary}>{x.summary}</div>

            <div style={styles.tagsRow}>
              {(x.tags || []).slice(0, 8).map((t) => (
                <span key={t} style={styles.tag}>
                  {t}
                </span>
              ))}
            </div>
          </Link>
        ))}
        {!loading && items.length === 0 ? <div style={styles.empty}>No entries found.</div> : null}
      </div>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 980, margin: "0 auto", padding: "28px 18px 70px" },
  top: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  h1: { margin: 0, fontSize: 34 },
  sub: { marginTop: 6, opacity: 0.85 },
  filters: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr 180px 180px 220px 120px",
    gap: 10,
  },
  input: { padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" },
  select: { padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" },
  btn: { padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" },
  btnWide: { padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" },
  err: { marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid rgba(255,0,0,0.35)" },
  list: { marginTop: 14, display: "grid", gap: 12 },
  card: {
    textDecoration: "none",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 16,
    display: "block",
  },
  cardTop: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" },
  title: { fontSize: 18, fontWeight: 800, letterSpacing: 0.2 },
  meta: { display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" },
  pill: {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    opacity: 0.9,
  },
  date: { fontSize: 12, opacity: 0.7, paddingTop: 4 },
  summary: { marginTop: 8, opacity: 0.88, lineHeight: 1.45 },
  tagsRow: { marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 },
  tag: {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    opacity: 0.85,
  },
  empty: { marginTop: 12, opacity: 0.8 },
};
