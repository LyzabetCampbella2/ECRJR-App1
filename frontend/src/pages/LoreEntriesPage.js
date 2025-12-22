// src/pages/LoreEntriesPage.js
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

function safeStr(x) {
  return typeof x === "string" ? x : "";
}

export default function LoreEntriesPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [doc, setDoc] = useState(null);

  const [q, setQ] = useState("");
  const [type, setType] = useState("all");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch("/api/lore/entries");
        const json = await res.json();

        if (!alive) return;
        if (!json?.ok) throw new Error(json?.message || "Failed to load lore entries");

        setDoc(json.data);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Unknown error");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // IMPORTANT: declare this once, and only once
  const allNodes = Array.isArray(doc?.nodes) ? doc.nodes : [];

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return allNodes.filter((n) => {
      if (type !== "all" && n.entryType !== type) return false;
      if (!query) return true;

      const hay = [
        n.id,
        n.archId,
        n.title,
        n.lore,
        n.shadowReflection,
      ]
        .map(safeStr)
        .join(" ")
        .toLowerCase();

      return hay.includes(query);
    });
  }, [allNodes, q, type]);

  if (loading) {
    return (
      <div style={styles.wrap}>
        <h2 style={styles.h2}>Magic Library</h2>
        <p>Loading…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div style={styles.wrap}>
        <h2 style={styles.h2}>Magic Library</h2>
        <p style={{ color: "#a33" }}>{err}</p>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.topbar}>
        <div>
          <h2 style={styles.h2}>Magic Library</h2>
          <div style={styles.meta}>
            <span>v{doc?.version || "?"}</span>
            <span>{doc?.counts?.totalNodes ?? allNodes.length} nodes</span>
          </div>
        </div>

        <div style={styles.controls}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search (id, title, lore, shadow)…"
            style={styles.input}
          />
          <select value={type} onChange={(e) => setType(e.target.value)} style={styles.select}>
            <option value="all">All</option>
            <option value="cosmology">Cosmology</option>
            <option value="law">Law</option>
            <option value="archetype">Archetype</option>
          </select>
        </div>
      </div>

      <div style={styles.grid}>
        {filtered.slice(0, 160).map((n) => (
          <div key={n.id} style={styles.card}>
            <div style={styles.cardTop}>
              <div>
                <div style={styles.title}>{n.title || n.id}</div>
                <div style={styles.sub}>
                  <code style={styles.code}>{n.id}</code>
                  <span style={styles.dot}>•</span>
                  <span>{n.entryType}</span>
                  {n.archId ? (
                    <>
                      <span style={styles.dot}>•</span>
                      <span>{n.archId}</span>
                    </>
                  ) : null}
                </div>
              </div>

              {n.glyph?.sigil ? <pre style={styles.sigil}>{n.glyph.sigil}</pre> : null}
            </div>

            {n.lore ? <div style={styles.body}>{n.lore}</div> : null}

            {n.shadowReflection ? <div style={styles.shadow}>{n.shadowReflection}</div> : null}

            <div style={styles.links}>
              <div style={{ marginBottom: 6, opacity: 0.8 }}>
                Linked nodes ({(n.linkedNodes || []).length})
              </div>
              <div style={styles.linkPills}>
                {(n.linkedNodes || []).slice(0, 10).map((id) => (
                  <Link key={id} to={`/lore/entry/${encodeURIComponent(id)}`} style={styles.pill}>
                    {id}
                  </Link>
                ))}
                {(n.linkedNodes || []).length > 10 ? <span style={styles.more}>…</span> : null}
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <Link to={`/lore/entry/${encodeURIComponent(n.id)}`} style={styles.openBtn}>
                Open entry →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filtered.length > 160 ? (
        <p style={styles.note}>Showing first 160 results. Search to narrow.</p>
      ) : null}
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 1120, margin: "0 auto", padding: 18 },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" },
  h2: { margin: 0, letterSpacing: 0.2 },
  meta: { display: "flex", gap: 12, marginTop: 6, fontSize: 13, opacity: 0.7 },
  controls: { display: "flex", gap: 10, alignItems: "center" },
  input: { padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,.18)", minWidth: 300 },
  select: { padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,.18)" },

  grid: { marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: 12 },
  card: { border: "1px solid rgba(0,0,0,.12)", borderRadius: 18, padding: 14, background: "rgba(255,255,255,.78)" },
  cardTop: { display: "flex", justifyContent: "space-between", gap: 10 },
  title: { fontWeight: 750, fontSize: 16 },
  sub: { marginTop: 6, fontSize: 12, opacity: 0.7, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
  dot: { opacity: 0.6 },
  code: { fontSize: 12, padding: "2px 6px", borderRadius: 8, background: "rgba(0,0,0,.04)" },

  sigil: {
    margin: 0,
    padding: 10,
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,.10)",
    background: "rgba(0,0,0,.03)",
    lineHeight: "12px",
    fontSize: 12,
    minWidth: 88,
    textAlign: "center",
    userSelect: "none",
  },

  body: { marginTop: 10, fontSize: 14, lineHeight: 1.55, opacity: 0.92 },
  shadow: { marginTop: 10, padding: 10, borderRadius: 14, background: "rgba(0,0,0,.04)", fontSize: 13, lineHeight: 1.5 },

  links: { marginTop: 12, fontSize: 12 },
  linkPills: { display: "flex", flexWrap: "wrap", gap: 8 },
  pill: {
    textDecoration: "none",
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,.12)",
    background: "rgba(255,255,255,.7)",
    color: "inherit",
  },
  more: { opacity: 0.6, padding: "6px 10px" },

  openBtn: {
    display: "inline-block",
    textDecoration: "none",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,.14)",
    background: "rgba(0,0,0,.03)",
    color: "inherit",
    fontWeight: 650,
  },

  note: { marginTop: 10, opacity: 0.65 },
};
