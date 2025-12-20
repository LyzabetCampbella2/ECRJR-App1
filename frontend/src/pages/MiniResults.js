import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../apiClient";

export default function MiniResults() {
  const navigate = useNavigate();
  const order = useMemo(() => ["mini_1", "mini_2", "mini_3", "mini_4", "mini_5"], []);

  const [loading, setLoading] = useState(true);
  const [serverResults, setServerResults] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      setLoading(true);
      setMsg("");

      try {
        const [r1, r2] = await Promise.allSettled([
          apiGet("/api/mini-tests/results"),
          apiGet("/api/lore/catalog"),
        ]);

        if (!mounted) return;

        const resultsRes = r1.status === "fulfilled" ? r1.value : null;
        const loreRes = r2.status === "fulfilled" ? r2.value : null;

        if (resultsRes?.success && resultsRes?.results) setServerResults(resultsRes.results);
        if (loreRes?.success && loreRes?.catalog) setCatalog(loreRes.catalog);

        setLoading(false);
      } catch {
        if (!mounted) return;
        setLoading(false);
      }
    }

    loadAll();
    return () => (mounted = false);
  }, []);

  const loreIndex = useMemo(() => {
    const lumMap = {};
    const shaMap = {};
    (catalog?.luminaries || []).forEach((l) => (lumMap[l.id] = l));
    (catalog?.shadows || []).forEach((s) => (shaMap[s.id] = s));
    return { lumMap, shaMap };
  }, [catalog]);

  const perMini = useMemo(() => {
    const fromServer = serverResults?.resultsById || null;

    return order.map((id) => {
      if (fromServer && fromServer[id]) return { id, result: fromServer[id], source: "server" };
      const raw = localStorage.getItem(`miniTestResult:${id}`);
      return { id, result: raw ? JSON.parse(raw) : null, source: raw ? "local" : "none" };
    });
  }, [order, serverResults]);

  const completedCount = perMini.filter((x) => !!x.result).length;
  const allComplete = completedCount === order.length;

  const combined = useMemo(() => {
    if (!allComplete) return null;

    const lumiCounts = {};
    const shadowCounts = {};
    const confs = [];

    perMini.forEach(({ result }) => {
      lumiCounts[result.luminaryId] = (lumiCounts[result.luminaryId] || 0) + 1;
      shadowCounts[result.shadowId] = (shadowCounts[result.shadowId] || 0) + 1;
      if (typeof result.confidence === "number") confs.push(result.confidence);
    });

    const topLumi = Object.entries(lumiCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
    const topShadow = Object.entries(shadowCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
    const avgConfidence = confs.length ? confs.reduce((s, n) => s + n, 0) / confs.length : 0.5;

    return { luminaryId: topLumi, shadowId: topShadow, avgConfidence };
  }, [allComplete, perMini]);

  const lumLore = combined?.luminaryId ? loreIndex.lumMap[combined.luminaryId] : null;
  const shaLore = combined?.shadowId ? loreIndex.shaMap[combined.shadowId] : null;

  const signalPct = useMemo(() => {
    if (!combined) return 0;
    return Math.max(0, Math.min(100, Math.round((combined.avgConfidence || 0) * 100)));
  }, [combined]);

  const shareText = useMemo(() => {
    if (!combined) return "";
    const L = lumLore?.name ? `${lumLore.name} — ${lumLore.title}` : combined.luminaryId;
    const S = shaLore?.name ? `${shaLore.name} — ${shaLore.title}` : combined.shadowId;
    return `EIRDEN — Luminary/Shadow\nLuminary: ${L}\nShadow: ${S}\nSignal: ${signalPct}%\n#EirdenAtelier #ECRJR`;
  }, [combined, lumLore, shaLore, signalPct]);

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareText);
      setMsg("Copied to clipboard.");
      setTimeout(() => setMsg(""), 1200);
    } catch {
      setMsg("Couldn’t copy. Select and copy manually.");
      setTimeout(() => setMsg(""), 1600);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.kicker}>THE VEIL PARTS</div>
        <div style={styles.h1}>Luminary & Shadow</div>
        <div style={styles.p}>
          Trials completed: <b>{completedCount}</b> / {order.length}
        </div>

        {msg ? <div style={styles.noticeBox}>{msg}</div> : null}

        {loading ? (
          <div style={styles.softBox}>
            <div style={styles.softTitle}>Listening for the signal…</div>
            <div style={styles.p}>Gathering your results + lore.</div>
          </div>
        ) : !allComplete ? (
          <div style={styles.lockBox}>
            <div style={styles.lockTitle}>Sealed</div>
            <div style={styles.p}>Complete all five trials to unveil the paired archetype.</div>
            <div style={styles.actions}>
              <button style={styles.primaryBtn} onClick={() => navigate("/dashboard")}>
                Return to the Threshold
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={styles.revealBox}>
              <div style={styles.revealTitle}>The Paired Reveal</div>

              <div style={styles.bigPair}>
                <div style={styles.pill}>
                  <div style={styles.pillLabel}>LUMINARY</div>
                  <div style={styles.pillValue}>
                    {lumLore?.name || combined.luminaryId}
                  </div>
                  <div style={styles.pillSub}>{lumLore?.title || ""}</div>
                  <div style={styles.pillDesc}>{lumLore?.overview || ""}</div>

                  {lumLore?.gifts?.length ? (
                    <div style={styles.listBlock}>
                      <div style={styles.listTitle}>Gifts</div>
                      <ul style={styles.ul}>
                        {lumLore.gifts.map((g) => (
                          <li key={g}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div style={styles.pill}>
                  <div style={styles.pillLabel}>SHADOW</div>
                  <div style={styles.pillValue}>
                    {shaLore?.name || combined.shadowId}
                  </div>
                  <div style={styles.pillSub}>{shaLore?.title || ""}</div>
                  <div style={styles.pillDesc}>{shaLore?.overview || ""}</div>

                  {shaLore?.warnings?.length ? (
                    <div style={styles.listBlock}>
                      <div style={styles.listTitle}>Warnings</div>
                      <ul style={styles.ul}>
                        {shaLore.warnings.map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>

              <div style={styles.signalRow}>
                <div style={styles.signalLabel}>Signal Strength</div>
                <div style={styles.signalBarOuter}>
                  <div style={{ ...styles.signalBarInner, width: `${signalPct}%` }} />
                </div>
                <div style={styles.signalPct}>{signalPct}%</div>
              </div>

              <div style={styles.shareBox}>
                <div style={styles.shareTitle}>Shareable Sigil Text</div>
                <pre style={styles.sharePre}>{shareText}</pre>
                <div style={styles.actions}>
                  <button style={styles.secondaryBtn} onClick={copyShare}>
                    Copy
                  </button>
                  <button style={styles.primaryBtn} onClick={() => navigate("/constellation")}>
                    Enter Constellation
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.actions}>
              <button style={styles.secondaryBtn} onClick={() => navigate("/dashboard")}>
                Return
              </button>
              <button style={styles.primaryBtn} onClick={() => navigate("/constellation")}>
                Constellation Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "flex", justifyContent: "center", padding: 18, background: "#0b0d12", color: "#eaeef6" },
  card: { width: "min(980px, 100%)", background: "linear-gradient(180deg, rgba(21,26,34,1) 0%, rgba(12,14,19,1) 100%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 18, boxShadow: "0 12px 40px rgba(0,0,0,0.55)" },
  kicker: { letterSpacing: 2, fontSize: 12, opacity: 0.7, fontWeight: 950 },
  h1: { fontSize: 28, fontWeight: 950, marginTop: 6, marginBottom: 6 },
  p: { opacity: 0.85, lineHeight: 1.4 },
  noticeBox: { marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(58,122,254,0.12)", border: "1px solid rgba(58,122,254,0.35)", fontWeight: 900 },
  softBox: { marginTop: 14, padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" },
  softTitle: { fontWeight: 950, marginBottom: 6 },
  lockBox: { marginTop: 14, padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" },
  lockTitle: { fontWeight: 950, marginBottom: 6 },
  revealBox: { marginTop: 14, padding: 14, borderRadius: 14, background: "rgba(58,122,254,0.10)", border: "1px solid rgba(58,122,254,0.30)" },
  revealTitle: { fontWeight: 950, marginBottom: 10 },
  bigPair: { display: "flex", gap: 12, flexWrap: "wrap" },
  pill: { flex: "1 1 300px", padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" },
  pillLabel: { fontSize: 12, opacity: 0.75, fontWeight: 900, letterSpacing: 1.2 },
  pillValue: { fontSize: 20, fontWeight: 950, marginTop: 6 },
  pillSub: { marginTop: 4, opacity: 0.8, fontWeight: 800 },
  pillDesc: { marginTop: 10, opacity: 0.82, lineHeight: 1.4, fontSize: 13 },
  listBlock: { marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.10)" },
  listTitle: { fontWeight: 950, marginBottom: 6, opacity: 0.9 },
  ul: { margin: 0, paddingLeft: 18, opacity: 0.9, lineHeight: 1.5 },
  signalRow: { marginTop: 14, display: "grid", gridTemplateColumns: "140px 1fr 60px", gap: 10, alignItems: "center" },
  signalLabel: { opacity: 0.8, fontWeight: 900 },
  signalBarOuter: { height: 12, borderRadius: 999, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.05)", overflow: "hidden" },
  signalBarInner: { height: "100%", borderRadius: 999, background: "rgba(58,122,254,0.9)", transition: "width 600ms ease" },
  signalPct: { textAlign: "right", fontWeight: 950, opacity: 0.9 },
  shareBox: { marginTop: 14, padding: 14, borderRadius: 14, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.10)" },
  shareTitle: { fontWeight: 950, marginBottom: 10 },
  sharePre: { whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.4, margin: 0, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", opacity: 0.92 },
  actions: { display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" },
  primaryBtn: { padding: "12px 14px", borderRadius: 12, border: "none", fontWeight: 950, background: "#3a7afe", color: "white" },
  secondaryBtn: { padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", fontWeight: 900, background: "transparent", color: "#eaeef6" }
};
