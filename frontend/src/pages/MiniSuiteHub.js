import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const LS_PROFILE_KEY = "eirden_profileKey_v1";

function getProfileKey() {
  const existing = localStorage.getItem(LS_PROFILE_KEY);
  if (existing) return existing;
  // fallback for debug/dev
  const fallback = "debug_profile";
  localStorage.setItem(LS_PROFILE_KEY, fallback);
  return fallback;
}

function pct01(x) {
  const n = Number(x);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n;
}

function sumObj(obj) {
  if (!obj || typeof obj !== "object") return 0;
  return Object.values(obj).reduce((a, b) => a + (Number(b) || 0), 0);
}

export default function MiniSuiteHub() {
  const nav = useNavigate();
  const profileKey = useMemo(() => getProfileKey(), []);

  const [loading, setLoading] = useState(true);
  const [suite, setSuite] = useState(null);
  const [results, setResults] = useState(null);
  const [err, setErr] = useState("");

  async function loadAll() {
    setLoading(true);
    setErr("");
    try {
      const [sRes, rRes] = await Promise.all([
        fetch("/api/mini-tests/suite"),
        fetch(`/api/mini-tests/results?profileKey=${encodeURIComponent(profileKey)}`),
      ]);

      const sData = await sRes.json();
      const rData = await rRes.json();

      if (!sData?.ok) throw new Error(sData?.message || "Failed to load suite");
      if (!rData?.ok) throw new Error(rData?.message || "Failed to load results");

      setSuite(sData);
      setResults(rData);
    } catch (e) {
      setErr(e?.message || "Failed to load mini suite");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submissionsById = useMemo(() => {
    const map = new Map();
    (results?.submissions || []).forEach((s) => map.set(s.miniTestId, s));
    return map;
  }, [results]);

  const orderedTests = useMemo(() => {
    const tests = suite?.suite?.tests || [];
    return tests.slice();
  }, [suite]);

  const nextUnfinished = useMemo(() => {
    for (const t of orderedTests) {
      if (!submissionsById.has(t.miniTestId)) return t;
    }
    return null;
  }, [orderedTests, submissionsById]);

  const suiteProgress = useMemo(() => {
    const total = orderedTests.length || 1;
    const done = (results?.submissions || []).length;
    return { done, total };
  }, [orderedTests, results]);

  const totalScore = useMemo(() => sumObj(results?.totals?.const), [results]);

  if (loading) {
    return (
      <div style={styles.page}>
        <h1 style={styles.h1}>Mini Suite</h1>
        <div style={styles.card}>Loading…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div style={styles.page}>
        <h1 style={styles.h1}>Mini Suite</h1>
        <div style={styles.card}>
          <div style={styles.errorTitle}>Couldn’t load</div>
          <div style={styles.small}>{err}</div>
          <button style={styles.btn} onClick={loadAll}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.h1}>Lumi / Shadow Mini Suite</h1>
          <div style={styles.sub}>
            Profile: <span style={styles.mono}>{profileKey}</span> • Progress:{" "}
            <b>
              {suiteProgress.done}/{suiteProgress.total}
            </b>{" "}
            • Score mass: <b>{Math.round(totalScore)}</b>
          </div>
        </div>

        <div style={styles.headerActions}>
          {nextUnfinished ? (
            <button
              style={styles.btnPrimary}
              onClick={() => nav(`/mini-tests/${nextUnfinished.miniTestId}`)}
              title="Continue the next unfinished mini test"
            >
              Continue: {nextUnfinished.miniTestId}
            </button>
          ) : (
            <button style={styles.btnPrimary} onClick={() => nav(`/mini-suite/results`)}>
              View Results
            </button>
          )}

          <button style={styles.btn} onClick={loadAll}>
            Refresh
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        {(orderedTests || []).map((t) => {
          const sub = submissionsById.get(t.miniTestId);
          const done = !!sub;
          const stamp = sub?.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "";
          return (
            <div key={t.miniTestId} style={styles.tile}>
              <div style={styles.tileTop}>
                <div style={styles.badgeRow}>
                  <span style={{ ...styles.badge, ...(done ? styles.badgeDone : styles.badgeTodo) }}>
                    {done ? "Completed" : "Not started"}
                  </span>
                  <span style={styles.badgeMuted}>{t.miniTestId}</span>
                </div>

                <div style={styles.tileTitle}>{t.title}</div>
                <div style={styles.tileNotes}>{t.notes}</div>

                {done && (
                  <div style={styles.small}>
                    Last submit: <span style={styles.mono}>{stamp}</span>
                  </div>
                )}
              </div>

              <div style={styles.tileBottom}>
                <Link to={`/mini-tests/${t.miniTestId}`} style={styles.linkBtn}>
                  {done ? "Review / Re-submit" : "Start"}
                </Link>
                <Link to={`/mini-suite/results`} style={styles.linkBtnSecondary}>
                  Results
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.footerCard}>
        <div style={styles.footerRow}>
          <div>
            <div style={styles.footerTitle}>Constellation View</div>
            <div style={styles.small}>See which constellations are lighting up as you complete tests.</div>
          </div>
          <Link to="/mini-suite/results" style={styles.linkBtn}>
            Open Results + Map
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 24, maxWidth: 1100, margin: "0 auto" },
  headerRow: { display: "flex", gap: 16, alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap" },
  headerActions: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },

  h1: { margin: 0, fontSize: 28, letterSpacing: 0.2 },
  sub: { marginTop: 6, opacity: 0.85, fontSize: 13 },
  mono: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 },

  card: { border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 16, background: "rgba(0,0,0,0.22)" },

  tile: { border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: 16, background: "rgba(0,0,0,0.18)", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 190 },
  tileTop: {},
  tileBottom: { display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" },

  tileTitle: { fontSize: 16, fontWeight: 700, marginTop: 10 },
  tileNotes: { marginTop: 6, fontSize: 13, opacity: 0.85, lineHeight: 1.35 },

  badgeRow: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  badge: { fontSize: 12, padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.18)" },
  badgeDone: { background: "rgba(255,255,255,0.08)" },
  badgeTodo: { background: "rgba(255,255,255,0.03)" },
  badgeMuted: { fontSize: 12, padding: "4px 10px", borderRadius: 999, opacity: 0.75, border: "1px solid rgba(255,255,255,0.12)" },

  btn: { padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "inherit", cursor: "pointer" },
  btnPrimary: { padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.12)", color: "inherit", cursor: "pointer", fontWeight: 700 },

  linkBtn: { padding: "10px 12px", borderRadius: 12, textDecoration: "none", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.10)", color: "inherit", fontWeight: 700 },
  linkBtnSecondary: { padding: "10px 12px", borderRadius: 12, textDecoration: "none", border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.05)", color: "inherit" },

  footerCard: { marginTop: 16, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: 16, background: "rgba(0,0,0,0.18)" },
  footerRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  footerTitle: { fontWeight: 800, marginBottom: 4 },

  small: { fontSize: 12, opacity: 0.82, lineHeight: 1.35 },
  errorTitle: { fontWeight: 800, marginBottom: 6 }
};
