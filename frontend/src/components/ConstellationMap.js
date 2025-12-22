import React, { useMemo, useState } from "react";

const CONST_IDS = Array.from({ length: 16 }, (_, i) => `C${String(i + 1).padStart(2, "0")}`);

function clamp01(x) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

export default function ConstellationMap({ totalsConst = {}, totalsTone = {}, title = "Constellation Map" }) {
  const [selected, setSelected] = useState(null);

  const nodes = useMemo(() => {
    const values = CONST_IDS.map((id) => ({ id, value: Number(totalsConst?.[id] || 0) }));
    const max = Math.max(1, ...values.map((v) => v.value));
    const min = Math.min(0, ...values.map((v) => v.value));
    return {
      min,
      max,
      values: values.map((v) => ({
        ...v,
        // normalize to 0..1
        norm: clamp01(v.value / max),
      })),
    };
  }, [totalsConst]);

  const toneSummary = useMemo(() => {
    const lum = Number(totalsTone?.lum || 0);
    const mix = Number(totalsTone?.mix || 0);
    const shd = Number(totalsTone?.shd || 0);
    const total = Math.max(1, lum + mix + shd);
    return {
      lum,
      mix,
      shd,
      total,
      lumPct: Math.round((lum / total) * 100),
      mixPct: Math.round((mix / total) * 100),
      shdPct: Math.round((shd / total) * 100),
    };
  }, [totalsTone]);

  const size = 520;
  const cx = size / 2;
  const cy = size / 2;
  const r = 185;

  const placed = useMemo(() => {
    const arr = nodes.values;
    return arr.map((n, idx) => {
      const a = (Math.PI * 2 * idx) / arr.length - Math.PI / 2;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      return { ...n, x, y, a };
    });
  }, [nodes]);

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>{title}</div>
          <div style={styles.sub}>
            Tone mix: <b>Lum {toneSummary.lumPct}%</b> • <b>Mix {toneSummary.mixPct}%</b> • <b>Shadow {toneSummary.shdPct}%</b>
          </div>
        </div>

        {selected ? (
          <div style={styles.detail}>
            <div style={styles.detailTop}>
              <span style={styles.detailId}>{selected.id}</span>
              <button style={styles.clearBtn} onClick={() => setSelected(null)}>
                Clear
              </button>
            </div>
            <div style={styles.detailLine}>
              Score: <b>{Math.round(selected.value)}</b>
            </div>
            <div style={styles.detailLine} title="Normalized within this suite">
              Intensity: <b>{Math.round(selected.norm * 100)}%</b>
            </div>
          </div>
        ) : (
          <div style={styles.hint}>Click a node for detail</div>
        )}
      </div>

      <div style={styles.canvasCard}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={styles.svg}>
          {/* center */}
          <circle cx={cx} cy={cy} r={4} opacity={0.7} />

          {/* spokes */}
          {placed.map((n) => (
            <line
              key={`spoke-${n.id}`}
              x1={cx}
              y1={cy}
              x2={n.x}
              y2={n.y}
              opacity={0.12 + n.norm * 0.35}
            />
          ))}

          {/* ring */}
          <circle cx={cx} cy={cy} r={r} fill="none" opacity={0.12} />

          {/* nodes */}
          {placed.map((n) => {
            const radius = 10 + n.norm * 14;
            const op = 0.25 + n.norm * 0.65;
            const isSel = selected?.id === n.id;

            return (
              <g key={n.id} onClick={() => setSelected(n)} style={{ cursor: "pointer" }}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={radius}
                  opacity={isSel ? 0.95 : op}
                />
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={radius + 6}
                  fill="none"
                  opacity={isSel ? 0.45 : 0.08}
                />
                <text
                  x={n.x}
                  y={n.y + 4}
                  textAnchor="middle"
                  fontSize="12"
                  opacity={0.95}
                  style={{ userSelect: "none", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
                >
                  {n.id}
                </text>
              </g>
            );
          })}
        </svg>

        <div style={styles.legend}>
          <div style={styles.legendRow}>
            <span style={styles.legendDot} />
            <span style={styles.legendText}>Higher score → larger/brighter node</span>
          </div>
          <div style={styles.legendRow}>
            <span style={{ ...styles.legendDot, opacity: 0.35 }} />
            <span style={styles.legendText}>Lower score → smaller/dimmer node</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { width: "100%" },
  header: { display: "flex", gap: 16, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", marginBottom: 10 },
  title: { fontWeight: 900, fontSize: 16 },
  sub: { fontSize: 12, opacity: 0.82, marginTop: 4 },

  canvasCard: { border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: 12, background: "rgba(0,0,0,0.18)" },
  svg: { width: "100%", height: "auto", display: "block" },

  hint: { fontSize: 12, opacity: 0.75, padding: 10, borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)" },

  detail: { minWidth: 220, padding: 10, borderRadius: 14, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.04)" },
  detailTop: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  detailId: { fontWeight: 900, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
  detailLine: { fontSize: 12, opacity: 0.9, marginTop: 6 },

  clearBtn: { padding: "6px 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "inherit", cursor: "pointer" },

  legend: { marginTop: 10, display: "flex", gap: 14, flexWrap: "wrap" },
  legendRow: { display: "flex", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 999, border: "1px solid rgba(255,255,255,0.35)" },
  legendText: { fontSize: 12, opacity: 0.8 }
};
