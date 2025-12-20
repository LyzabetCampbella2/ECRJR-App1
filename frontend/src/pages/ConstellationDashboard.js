// src/pages/ConstellationDashboard.js
// Modern Academia themed (App.css classes)

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../apiClient";

export default function ConstellationDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [error, setError] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // SVG sizing
  const W = 980;
  const H = 520;
  const PAD = 60;

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await apiGet("/api/constellation");
        if (!alive) return;

        if (!res || res.success !== true) {
          setError(res?.message || "Failed to load constellation.");
          setNodes([]);
          setEdges([]);
          setLoading(false);
          return;
        }

        setNodes(Array.isArray(res.constellation?.nodes) ? res.constellation.nodes : []);
        setEdges(Array.isArray(res.constellation?.edges) ? res.constellation.edges : []);
        setLoading(false);
      } catch (e) {
        if (!alive) return;
        setError("Failed to load constellation.");
        setNodes([]);
        setEdges([]);
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const nodeById = useMemo(() => {
    const m = new Map();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodeById.get(selectedNodeId) || null;
  }, [selectedNodeId, nodeById]);

  const grouped = useMemo(() => {
    return {
      lum: nodes.filter((n) => n?.kind === "luminary"),
      shad: nodes.filter((n) => n?.kind === "shadow"),
    };
  }, [nodes]);

  const safeLabel = (n) => {
    const label = typeof n?.label === "string" && n.label.trim().length ? n.label : "";
    if (label) return label;
    if (n?.kind === "luminary") return "Luminary";
    if (n?.kind === "shadow") return "Shadow";
    return "Node";
  };

  const score01 = (n) => {
    const s = typeof n?.score === "number" ? n.score : 0;
    const clamped = Math.max(0, Math.min(100, s));
    return clamped / 100;
  };

  const buildArchetypeUrl = (n) => {
    // Adjust if your AppRouter uses different paths
    if (n?.kind === "luminary") return `/archetypes/luminary/${n.luminaryId || n.id}`;
    if (n?.kind === "shadow") return `/archetypes/shadow/${n.shadowId || n.id}`;
    return `/archetypes/${n.id}`;
  };

  const openArchetype = (n) => {
    if (!n) return;
    navigate(buildArchetypeUrl(n));
  };

  // Layout: luminaries top, shadows bottom (deterministic)
  const positionedNodes = useMemo(() => {
    const positions = new Map();

    const top = grouped.lum;
    const bot = grouped.shad;

    const topCount = Math.max(top.length, 1);
    const botCount = Math.max(bot.length, 1);

    top.forEach((n, i) => {
      const t = topCount === 1 ? 0.5 : i / (topCount - 1);
      positions.set(n.id, { x: PAD + t * (W - 2 * PAD), y: PAD + 72 });
    });

    bot.forEach((n, i) => {
      const t = botCount === 1 ? 0.5 : i / (botCount - 1);
      positions.set(n.id, { x: PAD + t * (W - 2 * PAD), y: H - PAD - 72 });
    });

    nodes.forEach((n, i) => {
      if (!positions.has(n.id)) {
        const t = nodes.length === 1 ? 0.5 : i / Math.max(nodes.length - 1, 1);
        positions.set(n.id, { x: PAD + t * (W - 2 * PAD), y: H / 2 });
      }
    });

    return nodes.map((n) => ({ ...n, pos: positions.get(n.id) || { x: W / 2, y: H / 2 } }));
  }, [nodes, grouped]);

  // Edge highlight if selected
  const isEdgeActive = (e) =>
    selectedNodeId && (selectedNodeId === e.from || selectedNodeId === e.to);

  // Badge styling
  const badge = (n) => {
    if (n?.kind === "luminary") return <span className="badge badge-lum">✧ Luminary</span>;
    if (n?.kind === "shadow") return <span className="badge badge-shad">◈ Shadow</span>;
    return <span className="badge">• Node</span>;
  };

  if (loading) {
    return (
      <div className="page">
        <div className="row">
          <h1>Constellation</h1>
        </div>
        <div className="card" style={{ marginTop: 14 }}>
          <div className="subtle">Loading constellation…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="row">
          <h1>Constellation</h1>
        </div>
        <div className="card" style={{ marginTop: 14 }}>
          <div style={{ color: "crimson", fontWeight: 800 }}>{error}</div>
          <div className="divider subtle" style={{ marginTop: 12 }}>
            Quick check: your backend must serve <code>/api/constellation</code>.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <style>{`
        /* use the theme pulse but allow varying speeds per node */
        .ring {
          transform-origin: var(--origin-x) var(--origin-y);
          animation: pulseSoft var(--pulse) ease-in-out infinite;
        }
      `}</style>

      <div className="row">
        <div>
          <h1>Constellation</h1>
          <div className="subtle" style={{ marginTop: 6 }}>
            Modern academia theme · Click = lore · Double-click = open archetype.
          </div>
        </div>

        <div className="subtle" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <span>
            Luminaries: <strong>{grouped.lum.length}</strong>
          </span>
          <span>
            Shadows: <strong>{grouped.shad.length}</strong>
          </span>
        </div>
      </div>

      {/* MAP */}
      <div className="card card-lg constellation-wrap" style={{ marginTop: 16 }}>
        <div className="row">
          <h2>Constellation Map</h2>
          <div className="constellation-hint">Names come from <code>node.label</code>.</div>
        </div>

        <div style={{ marginTop: 12 }}>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
            <defs>
              <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* edges */}
            {edges.map((e, idx) => {
              const from = positionedNodes.find((n) => n.id === e.from);
              const to = positionedNodes.find((n) => n.id === e.to);
              if (!from || !to) return null;

              const active = isEdgeActive(e);

              return (
                <line
                  key={`${e.from}-${e.to}-${idx}`}
                  x1={from.pos.x}
                  y1={from.pos.y}
                  x2={to.pos.x}
                  y2={to.pos.y}
                  stroke="rgba(18,20,22,0.18)"
                  strokeWidth={active ? 2.6 : 1.2}
                />
              );
            })}

            {/* nodes */}
            {positionedNodes.map((n) => {
              const active = selectedNodeId === n.id;
              const s = score01(n);

              const baseR = n.kind === "luminary" ? 15 : 13;
              const r = baseR + Math.round(s * 10);
              const ringR = r + 10;

              const ringOpacity = 0.10 + s * 0.30;
              const fill = n.kind === "shadow" ? "rgba(18,20,22,0.16)" : "rgba(18,20,22,0.09)";

              const pulseSeconds = `${(2.6 - s * 1.3).toFixed(2)}s`;

              return (
                <g
                  key={n.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedNodeId(n.id)}
                  onDoubleClick={() => openArchetype(n)}
                >
                  {/* animated ring */}
                  <g
                    className="ring"
                    style={{
                      ["--origin-x"]: `${n.pos.x}px`,
                      ["--origin-y"]: `${n.pos.y}px`,
                      ["--pulse"]: pulseSeconds,
                    }}
                  >
                    <circle
                      cx={n.pos.x}
                      cy={n.pos.y}
                      r={ringR}
                      fill="transparent"
                      stroke="rgba(176,141,87,0.55)" /* muted gold */
                      strokeWidth={active ? 2 : 1}
                      opacity={active ? Math.min(1, ringOpacity + 0.22) : ringOpacity}
                      filter="url(#softGlow)"
                    />
                  </g>

                  <circle
                    cx={n.pos.x}
                    cy={n.pos.y}
                    r={active ? r + 2 : r}
                    fill={fill}
                    stroke={active ? "rgba(90,26,31,0.65)" : "rgba(18,20,22,0.42)"} /* oxblood when active */
                    strokeWidth={active ? 2 : 1}
                    filter="url(#softGlow)"
                  />

                  <text
                    x={n.pos.x}
                    y={n.pos.y - (r + 12)}
                    textAnchor="middle"
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      fill: "rgba(18,20,22,0.86)",
                      userSelect: "none",
                    }}
                  >
                    {safeLabel(n)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* LORE PANEL */}
        {selectedNode && (
          <div className="divider">
            <div className="row" style={{ alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "var(--serif)" }}>
                    {safeLabel(selectedNode)}
                  </div>
                  {badge(selectedNode)}
                </div>

                <div className="subtle" style={{ marginTop: 6, fontWeight: 800 }}>
                  Score: {typeof selectedNode.score === "number" ? selectedNode.score : "—"} ·{" "}
                  ID: {selectedNode.luminaryId || selectedNode.shadowId || selectedNode.id}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button className="btn btn-primary" onClick={() => openArchetype(selectedNode)}>
                  Open Archetype Page
                </button>
                <button className="btn btn-ghost" onClick={() => setSelectedNodeId(null)}>
                  Close
                </button>
              </div>
            </div>

            <div className="grid-2-uneven" style={{ marginTop: 12 }}>
              <div className="panel">
                <h3>Lore</h3>
                <div className="subtle" style={{ marginTop: 8 }}>
                  {selectedNode?.lore?.overview || "No overview yet. Add it in your catalog JSON."}
                </div>

                {Array.isArray(selectedNode?.lore?.traits) && selectedNode.lore.traits.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <h3>Traits</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                      {selectedNode.lore.traits.map((t, i) => (
                        <span key={`${t}-${i}`} className="badge">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(selectedNode?.lore?.gifts) && selectedNode.lore.gifts.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <h3>Gifts</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                      {selectedNode.lore.gifts.map((t, i) => (
                        <span key={`${t}-${i}`} className="badge">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="panel">
                <h3>Ritual / Antidote</h3>
                <div className="subtle" style={{ marginTop: 8 }}>
                  {selectedNode?.lore?.ritual ||
                    selectedNode?.lore?.antidote ||
                    "Add ritual/antidote in your catalog JSON."}
                </div>

                {(selectedNode?.lore?.shadowWarning || selectedNode?.lore?.cost) && (
                  <div style={{ marginTop: 12 }}>
                    <h3>Warning</h3>
                    <div className="subtle" style={{ marginTop: 8 }}>
                      {selectedNode.lore.shadowWarning || selectedNode.lore.cost}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 12 }} className="kv">
                  <div className="k">Type</div>
                  <div className="v">{selectedNode.kind}</div>
                </div>

                <div style={{ marginTop: 10 }} className="kv">
                  <div className="k">Score (0–100)</div>
                  <div className="v">{typeof selectedNode.score === "number" ? selectedNode.score : "—"}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LISTS */}
      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2>Luminaries</h2>
            <div className="subtle">Click to view lore</div>
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {grouped.lum.length === 0 ? (
              <div className="subtle">No luminaries yet.</div>
            ) : (
              grouped.lum.map((n) => (
                <button
                  key={n.id}
                  className={`node-list-btn ${selectedNodeId === n.id ? "active" : ""}`}
                  onClick={() => setSelectedNodeId(n.id)}
                  onDoubleClick={() => openArchetype(n)}
                  type="button"
                >
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 900 }}>{safeLabel(n)}</div>
                    <div className="subtle" style={{ fontWeight: 900 }}>
                      {typeof n.score === "number" ? n.score : ""}
                    </div>
                  </div>
                  <div className="subtle" style={{ marginTop: 6, fontSize: 13 }}>
                    {n.luminaryId || n.id}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2>Shadows</h2>
            <div className="subtle">Click to view lore</div>
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {grouped.shad.length === 0 ? (
              <div className="subtle">No shadows yet.</div>
            ) : (
              grouped.shad.map((n) => (
                <button
                  key={n.id}
                  className={`node-list-btn ${selectedNodeId === n.id ? "active" : ""}`}
                  onClick={() => setSelectedNodeId(n.id)}
                  onDoubleClick={() => openArchetype(n)}
                  type="button"
                >
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 900 }}>{safeLabel(n)}</div>
                    <div className="subtle" style={{ fontWeight: 900 }}>
                      {typeof n.score === "number" ? n.score : ""}
                    </div>
                  </div>
                  <div className="subtle" style={{ marginTop: 6, fontSize: 13 }}>
                    {n.shadowId || n.id}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="subtle">
          If double-click navigation 404s, we’ll update your AppRouter and create the archetype profile page routes to match{" "}
          <code>/archetypes/luminary/:id</code> and <code>/archetypes/shadow/:id</code>.
        </div>
      </div>
    </div>
  );
}
