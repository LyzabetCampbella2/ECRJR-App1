import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function LoreLinksPanel({ nodeId, archetypeId }) {
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!nodeId && !archetypeId) {
        setLinks([]);
        setErr("");
        return;
      }

      setLoading(true);
      setErr("");

      try {
        const params = new URLSearchParams();
        if (nodeId) params.set("nodeId", nodeId);
        if (archetypeId) params.set("archetypeId", archetypeId);

        const res = await fetch(`/api/lore/links?${params.toString()}`);
        const data = await res.json();
        if (!data.ok) throw new Error(data.message || "Failed to load lore links");
        if (!alive) return;

        setLinks(Array.isArray(data.items) ? data.items : []);
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to load lore links");
        setLinks([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [nodeId, archetypeId]);

  return (
    <div style={styles.card}>
      <div style={styles.title}>Attached Lore</div>
      <div style={styles.sub}>
        {nodeId ? <span style={styles.pill}>node: {nodeId}</span> : null}
        {archetypeId ? <span style={styles.pill}>arch: {archetypeId}</span> : null}
      </div>

      {loading ? <div style={styles.note}>Loading…</div> : null}
      {err ? <div style={styles.err}>⚠ {err}</div> : null}

      {links.length ? (
        <div style={styles.list}>
          {links.map((x) => (
            <Link key={x.id} to={`/codex/lore/${x.id}`} style={styles.link}>
              <div style={styles.linkTop}>
                <div style={styles.linkTitle}>{x.title}</div>
                <div style={styles.badges}>
                  <span style={styles.badge}>{x.type}</span>
                  <span style={styles.badge}>{x.canonLevel}</span>
                </div>
              </div>
              <div style={styles.snip}>{x.summary}</div>
            </Link>
          ))}
        </div>
      ) : (
        !loading && <div style={styles.empty}>No lore linked to this selection yet.</div>
      )}
    </div>
  );
}

const styles = {
  card: { border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: 14 },
  title: { fontWeight: 900, marginBottom: 8 },
  sub: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 },
  pill: { fontSize: 12, padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.16)", opacity: 0.9 },
  note: { opacity: 0.85, marginTop: 6 },
  err: { marginTop: 8, padding: 10, borderRadius: 12, border: "1px solid rgba(255,0,0,0.35)" },
  list: { marginTop: 10, display: "grid", gap: 10 },
  link: { textDecoration: "none", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 14, padding: 12, display: "block" },
  linkTop: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" },
  linkTitle: { fontWeight: 800 },
  badges: { display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" },
  badge: { fontSize: 11, padding: "3px 8px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.14)", opacity: 0.85 },
  snip: { marginTop: 6, opacity: 0.85, lineHeight: 1.45 },
  empty: { marginTop: 10, opacity: 0.8 },
};
