import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

function splitLines(md) {
  return String(md || "").split("\n");
}

export default function LoreEntryPage() {
  const { loreId } = useParams();
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`/api/lore/${encodeURIComponent(loreId)}`);
        const data = await res.json();
        if (!data.ok) throw new Error(data.message || "Failed to load entry");
        if (!alive) return;
        setEntry(data.entry || null);
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to load");
        setEntry(null);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [loreId]);

  return (
    <div style={styles.wrap}>
      <div style={styles.breadcrumbs}>
        <Link to="/codex" style={styles.link}>Codex</Link>
        <span style={{ opacity: 0.6 }}> / </span>
        <Link to="/codex/lore" style={styles.link}>Lore</Link>
      </div>

      {loading ? <div style={styles.note}>Loading…</div> : null}
      {err ? <div style={styles.err}>⚠ {err}</div> : null}

      {entry ? (
        <>
          <h1 style={styles.h1}>{entry.title}</h1>
          <div style={styles.metaRow}>
            <span style={styles.pill}>{entry.type}</span>
            <span style={styles.pill}>{entry.canonLevel}</span>
            {entry.updatedAt ? <span style={styles.date}>{entry.updatedAt}</span> : null}
          </div>

          <div style={styles.summary}>{entry.summary}</div>

          <div style={styles.panel}>
            {splitLines(entry.body).map((line, idx) => {
              const t = line.trim();
              if (!t) return <div key={idx} style={{ height: 10 }} />;
              if (t.startsWith("### ")) return <h3 key={idx} style={styles.h3}>{t.replace("### ", "")}</h3>;
              if (t.startsWith("## ")) return <h2 key={idx} style={styles.h2}>{t.replace("## ", "")}</h2>;
              if (t.startsWith("- ")) return <div key={idx} style={styles.li}>• {t.replace("- ", "")}</div>;
              return <div key={idx} style={styles.p}>{line}</div>;
            })}
          </div>

          <div style={styles.sideGrid}>
            <div style={styles.sideCard}>
              <div style={styles.sideTitle}>Tags</div>
              <div style={styles.tagRow}>
                {(entry.tags || []).map((t) => (
                  <span key={t} style={styles.tag}>{t}</span>
                ))}
              </div>
            </div>

            <div style={styles.sideCard}>
              <div style={styles.sideTitle}>Linked</div>
              <div style={styles.smallLabel}>Archetypes</div>
              <div style={styles.miniRow}>
                {(entry.linkedArchetypes || []).length ? (
                  entry.linkedArchetypes.map((a) => <span key={a} style={styles.miniPill}>{a}</span>)
                ) : (
                  <span style={{ opacity: 0.75 }}>None</span>
                )}
              </div>

              <div style={styles.smallLabel}>Constellation Nodes</div>
              <div style={styles.miniRow}>
                {(entry.linkedNodes || []).length ? (
                  entry.linkedNodes.map((n) => <span key={n} style={styles.miniPill}>{n}</span>)
                ) : (
                  <span style={{ opacity: 0.75 }}>None</span>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 980, margin: "0 auto", padding: "28px 18px 70px" },
  breadcrumbs: { marginBottom: 10, opacity: 0.9 },
  link: { textDecoration: "none" },
  note: { opacity: 0.85, marginTop: 10 },
  err: { marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid rgba(255,0,0,0.35)" },
  h1: { margin: "8px 0 6px", fontSize: 36, letterSpacing: 0.2 },
  metaRow: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 },
  pill: { fontSize: 12, padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.16)" },
  date: { fontSize: 12, opacity: 0.7 },
  summary: { opacity: 0.88, lineHeight: 1.55, maxWidth: 840, marginBottom: 12 },
  panel: { border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: 16 },
  h2: { margin: "14px 0 6px", fontSize: 20 },
  h3: { margin: "12px 0 6px", fontSize: 16 },
  p: { opacity: 0.9, lineHeight: 1.65 },
  li: { opacity: 0.9, lineHeight: 1.6, marginLeft: 6 },
  sideGrid: { marginTop: 14, display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" },
  sideCard: { border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: 16 },
  sideTitle: { fontWeight: 800, marginBottom: 8 },
  tagRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  tag: { fontSize: 12, padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.14)", opacity: 0.85 },
  smallLabel: { marginTop: 8, fontSize: 12, opacity: 0.7 },
  miniRow: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 },
  miniPill: { fontSize: 12, padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.14)" },
};
