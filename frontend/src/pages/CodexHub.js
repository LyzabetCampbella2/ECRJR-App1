import React from "react";
import { Link } from "react-router-dom";

export default function CodexHub() {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.h1}>Codex</h1>
      <p style={styles.sub}>
        Browse lore, meanings, and canon entries connected to your archetypes and constellations.
      </p>

      <div style={styles.grid}>
        <Link to="/codex/lore" style={styles.card}>
          <div style={styles.cardTitle}>Lore Library</div>
          <div style={styles.cardText}>Search entries, tags, canon tiers, and linked archetypes.</div>
        </Link>

        <Link to="/constellation" style={styles.card}>
          <div style={styles.cardTitle}>Constellation Map</div>
          <div style={styles.cardText}>
            Explore nodes — now with attached lore so the map “speaks.”
          </div>
        </Link>
      </div>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 980, margin: "0 auto", padding: "28px 18px 70px" },
  h1: { margin: 0, fontSize: 34, letterSpacing: 0.2 },
  sub: { marginTop: 10, opacity: 0.85, lineHeight: 1.5, maxWidth: 720 },
  grid: { marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 },
  card: {
    display: "block",
    textDecoration: "none",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
  },
  cardTitle: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
  cardText: { opacity: 0.85, lineHeight: 1.45 },
};
