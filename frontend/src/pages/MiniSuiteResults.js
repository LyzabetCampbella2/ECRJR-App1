import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ConstellationMap from "../components/ConstellationMap";

const LS_PROFILE_KEY = "eirden_profileKey_v1";

function getProfileKey() {
  return localStorage.getItem(LS_PROFILE_KEY) || "debug_profile";
}

function topN(obj, n = 10) {
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(obj)
    .map(([id, score]) => ({ id, score: Number(score || 0) }))
    .filter((x) => Number.isFinite(x.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

export default function MiniSuiteResults() {
  const profileKey = useMemo(() => getProfileKey(), []);
  const [loading, setLoading] = useState(true);
  const [suite, setSuite] = useState(null);
  const [results, setResults] = useState(null);
  const [err, setErr] = useState("");
  const [finishing, setFinishing] = useState(false);

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
      setErr(e?.message || "Failed to load mini suite results");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const top = useMemo(() => topN(results?.totals?.const, 10), [results]);
  const topTones = useMemo(() => topN(results?.totals?.tone, 3), [results]);

  const suiteTests = useMemo(() => suite?.suite?.tests || [], [suite]);

  const submissionMap = useMemo(() => {
    const map = new Map();
    (results?.submissions || []).forEach((s) => map.set(s.miniTestId, s));
    return map;
  }, [results]);

  const canFinish = useMemo(() => {
    return (results?.submissions || []).length >= (suiteTests.length || 5);
  }, [results, suiteTests]);

  async function finishSuite() {
    setFinishing(true);
    setErr("");
    try {
      const res = await fetch("/api/mini-tests/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileKey }),
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.message || "Finish failed");
      await loadAll();
    } catch (e) {
      setErr(e?.message || "Failed to finish suite");
    } finally {
      setFinishing(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <h1 style={styles.h1}>Mini Suite Results</h1>
        <div style={styles.card}>Loading…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div style={styles.page}>
        <h1 style={styles.h1}>Mini Suite Results</h1>
        <div style={styles.card}>
          <div style={styles.errorTitle}>Couldn’t load</div>
          <div style={styles.small}>{err}</div>
          <button style={styles.btn} onClick={loadAll}>
            Retry
          </button>
          <div style={{ marginTop: 10 }}>
            <Link to="/mini-suite" style={styles.linkBtn}>
              Back to Suite
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.h1}>Mini Suite Results</h1>
          <div style={styles.sub}>
            Profile: <span style={styles.mono}>{profileKey}</span> • Status:{" "}
            <b>{results?.suiteStatus || "unknown"}</b> • Completed:{" "}
            <b>
              {(results?.submissions || []).length}/{suiteTests.length || 5}
            </b>
          </div>
        </div>

        <div style={styles.headerActions}>
          <Link to="/mini-suite" style={styles.linkBtnSecondary}>
            Back to Suite
          </Link>

          <button style={styles.btn} onClick={loadAll}>
            Refresh
          </button>

          <button
            style={{ ...styles.btnPrimary, opacity: canFinish ? 1 : 0.55, cursor: canFinish ? "pointer" : "not-allowed" }}
            disabled={!canFinish || finishing}
            onClick={finishSuite}
            title={canFinish ? "Lock suite as finished" : "Complete all 5 mini tests first"}
          >
            {finishing ? "Finishing…" : "Finish Suite"}
          </button>
        </div>
      </div>

      {/* Map */}
      <ConstellationMap
        totalsConst={results?.totals?.const || {}}
        totalsTone={results?.totals?.tone || {}}
        title="Your Constellation Signal"
      />

      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.sectionTitle}>Top Constellations</div>
          {top.length === 0 ? (
            <div style={styles.small}>No scores yet. Submit at least one mini test.</div>
          ) : (
            <div style={styles.list}>
              {top.map((x) => (
                <div key={x.id} style={styles.listRow}>
                  <span style={styles.monoStrong}>{x.id}</span>
                  <span style={styles.score}>{Math.round(x.score)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.sectionTitle}>Tone Balance</div>
          {topTones.length === 0 ? (
            <div style={styles.small}>No tone totals yet.</div>
          ) : (
            <div style={styles.list}>
              {topTones.map((x) => (
                <div key={x.id} style={styles.listRow}>
                  <span style={styles.monoStrong}>{x.id.toUpperCase()}</span>
                  <span style={styles.score}>{Math.round(x.score)}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 10, ...styles.small }}>
            Tip: if Shadow dominates, it doesn’t mean “bad”—it often means “protective strategy is active.”
          </div>
        </div>
      </div>

      <div style={styles.card}>

        <div style={styles.sectionTitle}>Per Mini Test</div>
        <div style={styles.small}>
          You can re-open any mini test and re-submit; your latest submission replaces the previous one.
        </div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {suiteTests.map((t) => {
            const sub = submissionMap.get(t.miniTestId);
            const done = !!sub;
            const when = sub?.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "—";
            return (
              <div key={t.miniTestId} style={styles.tile}>
                <div style={styles.badgeRow}>
                  <span style={{ ...styles.badge, ...(done ? styles.badgeDone : styles.badgeTodo) }}>
                    {done ? "Completed" : "Not started"}
                  </span>
                  <span style={styles.badgeMuted}>{t.miniTestId}</span>
                </div>
                <div style={styles.tileTitle}>{t.title}</div>
                <div style={styles.tileNotes}>{t.notes}</div>
                <div style={styles.small}>
                  Last submit: <span style={styles.mono}>{when}</span>
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link to={`/mini-tests/${t.miniTestId}`} style={styles.linkBtn}>
                    {done ? "Review / Re-submit" : "Start"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 24, maxWidth: 1100, margin: "0 auto" },
  headerRow: { display: "flex", gap: 16, alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap" },
  headerActions: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },

  h1: { margin: 0, fontSize: 28, letterSpacing: 0.2 },
  sub: { marginTop: 6, opacity: 0.85, fontSize: 13 },
  mono: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
  monoStrong: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontWeight: 900 },

  card: { border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: 16, background: "rgba(0,0,0,0.18)", marginTop: 14 },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginTop: 14 },

  sectionTitle: { fontWeight: 900, marginBottom: 10, fontSize: 14 },

  list: { display: "flex", flexDirection: "column", gap: 8, marginTop: 8 },
  listRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)" },
  score: { fontWeight: 900 },

  tile: { border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: 14, background: "rgba(0,0,0,0.14)" },
  tileTitle: { fontSize: 15, fontWeight: 800, marginTop: 8 },
  tileNotes: { marginTop: 6, fontSize: 13, opacity: 0.85, lineHeight: 1.35 },

  badgeRow: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  badge: { fontSize: 12, padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.18)" },
  badgeDone: { background: "rgba(255,255,255,0.08)" },
  badgeTodo: { background: "rgba(255,255,255,0.03)" },
  badgeMuted: { fontSize: 12, padding: "4px 10px", borderRadius: 999, opacity: 0.75, border: "1px solid rgba(255,255,255,0.12)" },

  btn: { padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "inherit", cursor: "pointer" },
  btnPrimary: { padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.12)", color: "inherit", cursor: "pointer", fontWeight: 800 },

  linkBtn: { padding: "10px 12px", borderRadius: 12, textDecoration: "none", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.10)", color: "inherit", fontWeight: 700 },
  linkBtnSecondary: { padding: "10px 12px", borderRadius: 12, textDecoration: "none", border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.05)", color: "inherit" },

  small: { fontSize: 12, opacity: 0.82, lineHeight: 1.35 },
  errorTitle: { fontWeight: 800, marginBottom: 6 }
};
