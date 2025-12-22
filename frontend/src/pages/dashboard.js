// src/pages/Dashboard.js
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const LS_USER = "userId";
const LS_PILOT = "pilotAccess";
const LS_CONSENT = "consentAccepted";
const LS_PROFILEKEY = "profileKey";

function safeJsonParse(v, fallback = null) {
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [now, setNow] = useState(Date.now());
  const [health, setHealth] = useState({ ok: null, status: "unknown" });
  const [loreStats, setLoreStats] = useState({ nodes: 0, laws: 0, archetypes: 0, cosmology: 0 });
  const [err, setErr] = useState("");

  // Session-ish state (localStorage driven)
  const userId = localStorage.getItem(LS_USER) || "";
  const pilotAccess = (localStorage.getItem(LS_PILOT) || "") === "true";
  const consentAccepted = (localStorage.getItem(LS_CONSENT) || "") === "true";
  const profileKey = localStorage.getItem(LS_PROFILEKEY) || "debug_profile";

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000 * 20);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let alive = true;

    async function load() {
      setErr("");
      // Health check
      try {
        const r = await fetch("/api/health");
        const j = await r.json();
        if (!alive) return;
        setHealth({ ok: !!j?.ok, status: j?.status || "unknown" });
      } catch (e) {
        if (!alive) return;
        setHealth({ ok: false, status: "offline" });
      }

      // Lore stats (best-effort)
      try {
        const r = await fetch("/api/lore/entries");
        const j = await r.json();
        if (!alive) return;

        if (j?.ok && j?.data) {
          const nodes = Array.isArray(j.data.nodes) ? j.data.nodes : [];
          const tally = { nodes: nodes.length, laws: 0, archetypes: 0, cosmology: 0 };
          for (const n of nodes) {
            const t = String(n.entryType || "unknown").toLowerCase();
            if (t === "law") tally.laws += 1;
            else if (t === "archetype") tally.archetypes += 1;
            else if (t === "cosmology") tally.cosmology += 1;
          }
          setLoreStats(tally);
        } else {
          setLoreStats({ nodes: 0, laws: 0, archetypes: 0, cosmology: 0 });
        }
      } catch (e) {
        if (!alive) return;
        setLoreStats({ nodes: 0, laws: 0, archetypes: 0, cosmology: 0 });
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const greeting = useMemo(() => {
    const hr = new Date(now).getHours();
    if (hr < 5) return "Late night session";
    if (hr < 12) return "Good morning";
    if (hr < 17) return "Good afternoon";
    if (hr < 22) return "Good evening";
    return "Night mode";
  }, [now]);

  function doLogout() {
    // Keep it simple & predictable: clear the access-related keys
    localStorage.removeItem(LS_PILOT);
    localStorage.removeItem(LS_USER);
    localStorage.removeItem(LS_CONSENT);
    // keep profileKey if you want; uncomment to clear too:
    // localStorage.removeItem(LS_PROFILEKEY);
    navigate("/access");
  }

  function goAccess() {
    navigate("/access");
  }

  const statusPills = [
    { label: `API: ${health.ok ? "online" : "offline"}`, tone: health.ok ? "ok" : "bad" },
    { label: `Pilot: ${pilotAccess ? "yes" : "no"}`, tone: pilotAccess ? "ok" : "warn" },
    { label: `Consent: ${consentAccepted ? "yes" : "no"}`, tone: consentAccepted ? "ok" : "warn" },
    { label: `Profile: ${profileKey}`, tone: "neutral" },
  ];

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.kicker}>{greeting}</div>
          <h1 style={styles.h1}>Dashboard</h1>
          <div style={styles.sub}>
            <span style={styles.mono}>userId:</span>{" "}
            <span style={styles.monoSoft}>{userId || "(none)"}</span>
            <span style={{ margin: "0 10px", opacity: 0.35 }}>•</span>
            <span style={styles.mono}>{new Date(now).toLocaleString()}</span>
          </div>
        </div>

        <div style={styles.headerRight}>
          <button style={styles.btnGhost} onClick={goAccess} title="Go to access page">
            Access
          </button>
          <button style={styles.btnDanger} onClick={doLogout} title="Clear local access keys">
            Log out
          </button>
        </div>
      </header>

      <section style={styles.pillsRow}>
        {statusPills.map((p) => (
          <span key={p.label} style={{ ...styles.pill, ...pillTone(p.tone) }}>
            {p.label}
          </span>
        ))}
      </section>

      {err ? <div style={styles.err}>{err}</div> : null}

      <section style={styles.grid}>
        {/* MAGIC LIBRARY */}
        <Link to="/magic" style={styles.card}>
          <div style={styles.cardTop}>
            <div style={styles.cardTitle}>Magic Library</div>
            <span style={styles.badge}>Library</span>
          </div>
          <div style={styles.cardDesc}>
            Browse your lore nodes, archetypes, laws, and cosmology entries.
          </div>
          <div style={styles.cardMeta}>
            Nodes: <strong>{loreStats.nodes}</strong> • Laws: <strong>{loreStats.laws}</strong>
          </div>
          <div style={styles.cardCta}>Open →</div>
        </Link>

        {/* LORE INDEX */}
        <Link to="/lore" style={styles.card}>
          <div style={styles.cardTop}>
            <div style={styles.cardTitle}>Lore Index</div>
            <span style={styles.badge}>Browse</span>
          </div>
          <div style={styles.cardDesc}>
            Search and open individual lore entries with linkedNodes navigation.
          </div>
          <div style={styles.cardMeta}>
            Cosmology: <strong>{loreStats.cosmology}</strong> • Archetypes:{" "}
            <strong>{loreStats.archetypes}</strong>
          </div>
          <div style={styles.cardCta}>Open →</div>
        </Link>

        {/* CONSTELLATION MAP */}
        <Link to="/constellation/map" style={styles.card}>
          <div style={styles.cardTop}>
            <div style={styles.cardTitle}>Constellation Map</div>
            <span style={styles.badge}>Map</span>
          </div>
          <div style={styles.cardDesc}>
            Explore the narrated node-graph. Toggle load 400/900, color by law-attractor clusters,
            highlight clusters, export snapshot + transcript.
          </div>
          <div style={styles.cardMeta}>
            Mode: <strong>Interactive</strong> • Export: <strong>PNG + TXT</strong>
          </div>
          <div style={styles.cardCta}>Open →</div>
        </Link>

        {/* ARCHETYPES */}
        <Link to="/archetypes" style={styles.card}>
          <div style={styles.cardTop}>
            <div style={styles.cardTitle}>Archetypes</div>
            <span style={styles.badge}>Profiles</span>
          </div>
          <div style={styles.cardDesc}>
            Browse archetypes, open profile pages, and jump into archetype-linked lore.
          </div>
          <div style={styles.cardMeta}>
            Tools: <strong>List</strong> • <strong>Profile</strong>
          </div>
          <div style={styles.cardCta}>Open →</div>
        </Link>

        {/* TESTS HUB */}
        <Link to="/tests" style={styles.card}>
          <div style={styles.cardTop}>
            <div style={styles.cardTitle}>Tests Hub</div>
            <span style={styles.badge}>Tests</span>
          </div>
          <div style={styles.cardDesc}>
            Start tests, continue a suite, submit assignments, and view results.
          </div>
          <div style={styles.cardMeta}>
            Mini + Major • Results • Uploads
          </div>
          <div style={styles.cardCta}>Open →</div>
        </Link>

        {/* MINI SUITE */}
        <Link to="/mini" style={styles.card}>
          <div style={styles.cardTop}>
            <div style={styles.cardTitle}>Mini Suite</div>
            <span style={styles.badge}>7-Day</span>
          </div>
          <div style={styles.cardDesc}>
            Your mini tests and assignments flow. Continue where you left off.
          </div>
          <div style={styles.cardMeta}>
            Status: <strong>In progress</strong>
          </div>
          <div style={styles.cardCta}>Open →</div>
        </Link>

        {/* MAJOR TEST */}
        <Link to="/major-test" style={styles.card}>
          <div style={styles.cardTop}>
            <div style={styles.cardTitle}>Major Test</div>
            <span style={styles.badge}>Scored</span>
          </div>
          <div style={styles.cardDesc}>
            The deep, multi-day test experience with assignments and scoring.
          </div>
          <div style={styles.cardMeta}>
            Run: <strong>7-Day</strong> • Outputs: <strong>Totals</strong>
          </div>
          <div style={styles.cardCta}>Open →</div>
        </Link>

        {/* ADMIN TOOLS */}
        <Link to="/pilot-codes" style={styles.card}>
          <div style={styles.cardTop}>
            <div style={styles.cardTitle}>Pilot Codes</div>
            <span style={styles.badge}>Admin</span>
          </div>
          <div style={styles.cardDesc}>
            Generate pilot access codes and manage limited-use keys.
          </div>
          <div style={styles.cardMeta}>
            Admin key required
          </div>
          <div style={styles.cardCta}>Open →</div>
        </Link>
      </section>

      <section style={styles.footerRow}>
        <div style={styles.footerCard}>
          <div style={{ fontWeight: 850 }}>Quick links</div>
          <div style={styles.footerLinks}>
            <Link to="/magic" style={styles.footerLink}>Magic Library</Link>
            <Link to="/lore/entries" style={styles.footerLink}>Lore Entries</Link>
            <Link to="/constellation/map" style={styles.footerLink}>Constellation Map</Link>
            <Link to="/archetypes" style={styles.footerLink}>Archetypes</Link>
            <Link to="/tests" style={styles.footerLink}>Tests Hub</Link>
          </div>
        </div>

        <div style={styles.footerCard}>
          <div style={{ fontWeight: 850 }}>Status</div>
          <div style={{ marginTop: 8, opacity: 0.85, lineHeight: 1.55, fontSize: 13 }}>
            If a page “flickers”, it’s usually a route guard redirecting to <span style={styles.mono}>/access</span>.
            Your pills above tell you instantly whether Pilot + Consent are set.
          </div>
        </div>
      </section>
    </div>
  );
}

function pillTone(tone) {
  if (tone === "ok") return { background: "rgba(46, 125, 50, .10)", borderColor: "rgba(46,125,50,.25)" };
  if (tone === "warn") return { background: "rgba(255, 143, 0, .10)", borderColor: "rgba(255,143,0,.28)" };
  if (tone === "bad") return { background: "rgba(198, 40, 40, .10)", borderColor: "rgba(198,40,40,.25)" };
  return { background: "rgba(0,0,0,.04)", borderColor: "rgba(0,0,0,.12)" };
}

const styles = {
  page: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: 18,
  },
  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    opacity: 0.65,
    marginBottom: 6,
  },
  h1: {
    margin: 0,
    fontSize: 34,
    letterSpacing: -0.6,
  },
  sub: {
    marginTop: 8,
    opacity: 0.75,
    fontSize: 13,
    lineHeight: 1.4,
  },
  mono: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: 12,
  },
  monoSoft: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: 12,
    opacity: 0.85,
  },
  headerRight: { display: "flex", gap: 10, alignItems: "center" },
  btnGhost: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,.18)",
    background: "rgba(255,255,255,.7)",
    cursor: "pointer",
    fontWeight: 750,
  },
  btnDanger: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(198,40,40,.25)",
    background: "rgba(198,40,40,.10)",
    cursor: "pointer",
    fontWeight: 850,
  },
  pillsRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 14,
    marginBottom: 14,
  },
  pill: {
    border: "1px solid rgba(0,0,0,.12)",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 750,
  },
  err: {
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(198,40,40,.25)",
    background: "rgba(198,40,40,.08)",
    color: "#7a1f1f",
    marginBottom: 12,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
  },
  card: {
    display: "block",
    textDecoration: "none",
    color: "inherit",
    border: "1px solid rgba(0,0,0,.12)",
    borderRadius: 18,
    padding: 14,
    background: "rgba(255,255,255,.75)",
    boxShadow: "0 8px 24px rgba(0,0,0,.05)",
    transition: "transform .08s ease, box-shadow .08s ease",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },
  badge: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.3,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,.12)",
    background: "rgba(0,0,0,.03)",
    opacity: 0.9,
  },
  cardTitle: { fontWeight: 950, fontSize: 16, letterSpacing: -0.2 },
  cardDesc: { marginTop: 10, opacity: 0.82, lineHeight: 1.55, fontSize: 13 },
  cardMeta: { marginTop: 10, fontSize: 12, opacity: 0.75 },
  cardCta: { marginTop: 12, fontWeight: 900, opacity: 0.9 },
  footerRow: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  footerCard: {
    border: "1px solid rgba(0,0,0,.12)",
    borderRadius: 18,
    padding: 14,
    background: "rgba(255,255,255,.75)",
  },
  footerLinks: { marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10 },
  footerLink: {
    textDecoration: "none",
    color: "inherit",
    fontWeight: 850,
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,.12)",
    background: "rgba(0,0,0,.03)",
  },
};
