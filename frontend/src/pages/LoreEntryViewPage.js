// src/pages/LoreEntryViewPage.js
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

export default function LoreEntryViewPage() {
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
        const res = await fetch(`/api/lore/entries/${encodeURIComponent(id)}`);
        const json = await res.json();
        if (!alive) return;
        if (!json?.ok) throw new Error(json?.message || "Entry not found");
        setEntry(json.data);
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
  }, [id]);

  if (loading) return <div style={styles.wrap}><p>Loading…</p></div>;
  if (err) return <div style={styles.wrap}><p style={{ color: "#a33" }}>{err}</p></div>;
  if (!entry) return <div style={styles.wrap}><p>Not found.</p></div>;

  return (
    <div style={styles.wrap}>
      <div style={{ marginBottom: 14 }}>
        <Link to="/lore/entries" style={styles.back}>← Back to Lore Library</Link>
      </div>

      <div style={styles.card}>
        <div style={styles.top}>
          <div>
            <h2 style={styles.h2}>{entry.title || entry.id}</h2>
            <div style={styles.meta}>
              <code style={styles.code}>{entry.id}</code>
              <span style={{ opacity: 0.6 }}>•</span>
              <span>{entry.entryType}</span>
              {entry.archId ? (
                <>
                  <span style={{ opacity: 0.6 }}>•</span>
                  <span>{entry.archId}</span>
                </>
              ) : null}
            </div>
          </div>

          {entry.glyph?.sigil ? <pre style={styles.sigil}>{entry.glyph.sigil}</pre> : null}
        </div>

        {entry.lore ? <p style={styles.lore}>{entry.lore}</p> : null}

        {entry.shadowReflection ? (
          <div style={styles.shadow}>
            <strong>Shadow reflection</strong>
            <div style={{ marginTop: 8 }}>{entry.shadowReflection}</div>
          </div>
        ) : null}

        <div style={styles.links}>
          <strong>linkedNodes</strong>
          <div style={styles.linkRow}>
            {(entry.linkedNodes || []).map((nid) => (
              <Link key={nid} to={`/lore/entry/${encodeURIComponent(nid)}`} style={styles.pill}>
                {nid}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 960, margin: "0 auto", padding: 18 },
  back: { textDecoration: "none", color: "inherit", opacity: 0.8 },
  card: { border: "1px solid rgba(0,0,0,.12)", borderRadius: 18, padding: 16, background: "rgba(255,255,255,.78)" },
  top: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" },
  h2: { margin: 0 },
  meta: { marginTop: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", opacity: 0.75 },
  code: { fontSize: 12, padding: "2px 6px", borderRadius: 8, background: "rgba(0,0,0,.04)" },
  sigil: { margin: 0, padding: 10, borderRadius: 14, border: "1px solid rgba(0,0,0,.10)", background: "rgba(0,0,0,.03)", lineHeight: "12px", fontSize: 12 },
  lore: { marginTop: 14, lineHeight: 1.6, fontSize: 15, opacity: 0.95 },
  shadow: { marginTop: 14, padding: 12, borderRadius: 14, background: "rgba(0,0,0,.04)" },
  links: { marginTop: 14 },
  linkRow: { marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 },
  pill: { textDecoration: "none", fontSize: 12, padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(0,0,0,.12)", background: "rgba(255,255,255,.7)", color: "inherit" },
};
