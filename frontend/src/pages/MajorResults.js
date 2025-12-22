// frontend/src/pages/MajorResults.js
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const LS_KEY = "lastMajorTestResult_v1";

function clampPct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}

function fmt2(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0";
  const rounded = Math.round(x * 100) / 100;
  return String(rounded);
}

function entriesSortedDesc(obj) {
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(obj)
    .map(([k, v]) => ({ id: k, score: Number(v || 0) }))
    .filter((x) => Number.isFinite(x.score))
    .sort((a, b) => b.score - a.score);
}

function ProgressBar({ pct }) {
  const p = clampPct(pct);
  return (
    <div style={{ height: 10, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
      <div style={{ width: `${p}%`, height: "100%", background: "rgba(255,255,255,0.35)" }} />
    </div>
  );
}

export default function MajorResults() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return setResult(null);
      setResult(JSON.parse(raw));
    } catch {
      setResult(null);
    }
  }, []);

  const perDayRows = useMemo(() => {
    if (!result?.perDay || typeof result.perDay !== "object") return [];
    return Object.entries(result.perDay)
      .map(([day, v]) => {
        const earned = Number(v?.earned || 0);
        const possible = Number(v?.possible || 0);
        const pct = Number(v?.pct ?? (possible > 0 ? (earned / possible) * 100 : 0));
        return { day: Number(day), earned, possible, pct };
      })
      .filter((r) => Number.isFinite(r.day))
      .sort((a, b) => a.day - b.day);
  }, [result]);

  const topConstellations = useMemo(() => {
    const pre = Array.isArray(result?.topConstellations) ? result.topConstellations : null;
    if (pre?.length) return pre;
    return entriesSortedDesc(result?.totals?.const).slice(0, 10);
  }, [result]);

  const tones = useMemo(() => {
    const toneObj = result?.totals?.tone || {};
    const lum = Number(toneObj.lum || 0);
    const mix = Number(toneObj.mix || 0);
    const shd = Number(toneObj.shd || 0);
    const sum = lum + mix + shd;
    const pct = (x) => (sum > 0 ? Math.round((x / sum) * 100) : 0);
    return { lum, mix, shd, sum, lumPct: pct(lum), mixPct: pct(mix), shdPct: pct(shd) };
  }, [result]);

  const galleryByDay = useMemo(() => {
    const items = result?.gallery?.items || [];
    const map = new Map();
    for (const it of items) {
      const d = Number(it.day || 0) || 0;
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(it);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [result]);

  if (!result) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.h1}>Major Results</h1>
          <p style={styles.p}>No saved result found on this device yet.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
            <Link to="/major-test" style={styles.btnPrimary}>Go to Major Test</Link>
            <Link to="/dashboard" style={styles.btnGhost}>Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const legendParas = result?.legend?.paragraphs || [];
  const bestOf = result?.gallery?.bestOfUrl || "";

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.h1}>Major Results</h1>
          <div style={styles.meta}>
            <span><b>Profile:</b> {result.profileKey || "—"}</span>
            <span style={styles.dot}>•</span>
            <span><b>Submitted:</b> {result.submittedAt ? new Date(result.submittedAt).toLocaleString() : "—"}</span>
          </div>
          {result?.raveliquar?.name ? (
            <div style={{ marginTop: 10, opacity: 0.92 }}>
              <b>Raveliquar:</b> {result.raveliquar.name}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            style={styles.btnGhost}
            onClick={() => {
              localStorage.removeItem(LS_KEY);
              setResult(null);
            }}
          >
            Clear Local Result
          </button>
          <button style={styles.btnPrimary} onClick={() => navigate("/major-test")}>Back to Major Test</button>
        </div>
      </div>

      {/* Legend */}
      {legendParas.length ? (
        <div style={styles.card}>
          <h2 style={styles.h2}>Legend</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {legendParas.map((p, idx) => (
              <p key={idx} style={styles.p}>{p}</p>
            ))}
          </div>
        </div>
      ) : null}

      {/* Progress + Tone */}
      <div style={styles.grid2}>
        <div style={styles.card}>
          <h2 style={styles.h2}>7-Day Progress</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {perDayRows.length === 0 ? (
              <p style={styles.p}>No per-day breakdown found.</p>
            ) : (
              perDayRows.map((r) => (
                <div key={r.day} style={styles.dayRow}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 800 }}>Day {r.day}</div>
                    <div style={{ opacity: 0.85 }}>
                      {fmt2(r.earned)} / {fmt2(r.possible)} ({clampPct(r.pct)}%)
                    </div>
                  </div>
                  <ProgressBar pct={r.pct} />
                </div>
              ))
            )}
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.h2}>Tone Split</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={styles.kvRow}><div><b>Luminary</b></div><div>{fmt2(tones.lum)} ({tones.lumPct}%)</div></div>
              <ProgressBar pct={tones.lumPct} />
            </div>
            <div>
              <div style={styles.kvRow}><div><b>Mixed</b></div><div>{fmt2(tones.mix)} ({tones.mixPct}%)</div></div>
              <ProgressBar pct={tones.mixPct} />
            </div>
            <div>
              <div style={styles.kvRow}><div><b>Shadow</b></div><div>{fmt2(tones.shd)} ({tones.shdPct}%)</div></div>
              <ProgressBar pct={tones.shdPct} />
            </div>
          </div>
        </div>
      </div>

      {/* Constellations */}
      <div style={styles.card}>
        <h2 style={styles.h2}>Top Constellations</h2>
        {topConstellations.length === 0 ? (
          <p style={styles.p}>No constellation totals found.</p>
        ) : (
          <div style={styles.pills}>
            {topConstellations.slice(0, 10).map((c) => (
              <div key={c.id} style={styles.pill}>
                <div style={{ fontWeight: 900 }}>{c.id}</div>
                <div style={{ opacity: 0.85 }}>{fmt2(c.score)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Luminaries + Shadows + Axes */}
      <div style={styles.grid2}>
        <div style={styles.card}>
          <h2 style={styles.h2}>Luminaries</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(result.luminaries || []).map((x) => (
              <div key={x.constellation} style={styles.rowCard}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 900 }}>{x.name}</div>
                  <div style={{ opacity: 0.85 }}>{x.constellation}</div>
                </div>
                <div style={{ opacity: 0.86, marginTop: 4 }}>{x.gift}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.h2}>Shadows</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(result.shadows || []).map((x) => (
              <div key={x.constellation} style={styles.rowCard}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 900 }}>{x.name}</div>
                  <div style={{ opacity: 0.85 }}>{x.constellation}</div>
                </div>
                <div style={{ opacity: 0.86, marginTop: 4 }}>{x.snag}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {Array.isArray(result.narrativeAxes) && result.narrativeAxes.length ? (
        <div style={styles.card}>
          <h2 style={styles.h2}>Narrative Axes</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {result.narrativeAxes.map((ax) => (
              <div key={ax.axis} style={styles.rowCard}>
                <div style={{ fontWeight: 900 }}>Axis {ax.axis}</div>
                <div style={{ marginTop: 6, opacity: 0.9 }}>
                  <b>{ax.luminary?.name}</b> ↔ <b>{ax.shadow?.name}</b>
                </div>
                <div style={{ marginTop: 6, opacity: 0.86 }}>{ax.integration}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Week Gallery */}
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
          <h2 style={styles.h2}>Week Gallery</h2>
          {bestOf ? (
            <a href={bestOf} target="_blank" rel="noreferrer" style={styles.link}>Open Best-Of</a>
          ) : (
            <span style={{ opacity: 0.7 }}>No Best-Of selected</span>
          )}
        </div>

        {galleryByDay.length === 0 ? (
          <p style={styles.p}>No uploads were detected in your submission.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 10 }}>
            {galleryByDay.map(([d, items]) => (
              <div key={d}>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>Day {d}</div>
                <div style={styles.galleryGrid}>
                  {items.map((it) => {
                    const isBest = result?.gallery?.bestOfFileKey && it.fileKey === result.gallery.bestOfFileKey;
                    return (
                      <a
                        key={`${it.questionId}:${it.fileKey}`}
                        href={it.url}
                        target="_blank"
                        rel="noreferrer"
                        style={isBest ? styles.galleryItemBest : styles.galleryItem}
                        title={it.prompt || it.category || it.questionId}
                      >
                        {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
                        <img src={it.url} alt="upload" style={styles.galleryImg} />
                        <div style={styles.galleryCaption}>
                          <div style={{ fontWeight: 900, fontSize: 12 }}>
                            {isBest ? "Best-Of" : it.isAssignment ? "Assignment" : "Upload"}
                          </div>
                          <div style={{ opacity: 0.78, fontSize: 12 }}>
                            {it.questionId}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Debug */}
      <details style={styles.card}>
        <summary style={{ cursor: "pointer", fontWeight: 900 }}>Debug totals</summary>
        <pre style={styles.pre}>{JSON.stringify(result.totals, null, 2)}</pre>
      </details>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link to="/dashboard" style={styles.btnGhost}>Dashboard</Link>
        <Link to="/major-test" style={styles.btnPrimary}>Run Again</Link>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "28px 18px 70px", maxWidth: 1150, margin: "0 auto", color: "rgba(255,255,255,0.92)" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 16 },
  h1: { fontSize: 28, margin: 0, letterSpacing: 0.2 },
  h2: { fontSize: 18, margin: "0 0 10px 0", letterSpacing: 0.2 },
  p: { margin: 0, opacity: 0.9, lineHeight: 1.55 },
  meta: { display: "flex", alignItems: "center", gap: 8, marginTop: 6, opacity: 0.85, flexWrap: "wrap" },
  dot: { opacity: 0.6 },
  card: {
    background: "rgba(0,0,0,0.28)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
    marginBottom: 14,
  },
  grid2: { display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14, marginBottom: 14 },
  dayRow: { display: "flex", flexDirection: "column", gap: 8 },
  kvRow: { display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 },
  pills: { display: "flex", gap: 10, flexWrap: "wrap" },
  pill: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "10px 12px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    minWidth: 90,
  },
  rowCard: {
    padding: 12,
    borderRadius: 14,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.10)",
  },
  link: { color: "rgba(255,255,255,0.92)", textDecoration: "underline", fontWeight: 900 },
  galleryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: 10,
  },
  galleryItem: {
    display: "flex",
    flexDirection: "column",
    borderRadius: 14,
    overflow: "hidden",
    textDecoration: "none",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
  },
  galleryItemBest: {
    display: "flex",
    flexDirection: "column",
    borderRadius: 14,
    overflow: "hidden",
    textDecoration: "none",
    border: "1px solid rgba(255,255,255,0.28)",
    background: "rgba(255,255,255,0.10)",
  },
  galleryImg: { width: "100%", height: 120, objectFit: "cover", display: "block" },
  galleryCaption: { padding: 10 },
  pre: {
    margin: 0,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    opacity: 0.9,
    fontSize: 12,
    lineHeight: 1.4,
  },
  btnPrimary: {
    display: "inline-block",
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.18)",
    border: "1px solid rgba(255,255,255,0.22)",
    color: "rgba(255,255,255,0.95)",
    textDecoration: "none",
    fontWeight: 900,
  },
  btnGhost: {
    display: "inline-block",
    padding: "10px 12px",
    borderRadius: 12,
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "rgba(255,255,255,0.9)",
    fontWeight: 900,
    textDecoration: "none",
  },
};

// responsive (simple)
try {
  if (window?.matchMedia?.("(max-width: 860px)")?.matches) {
    styles.grid2.gridTemplateColumns = "1fr";
  }
} catch {}
