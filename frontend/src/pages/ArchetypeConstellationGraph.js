// frontend/src/pages/ArchetypeConstellationGraph.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import * as d3 from "d3";

/**
 * ArchetypeConstellationGraph (FULL)
 * ✅ Single source of truth: GET /api/constellation returns star.name + nodes + edges
 * ✅ Rename Star UI: POST /api/star-profile then refresh constellation
 * ✅ D3 force-directed graph: zoom/pan + drag
 * ✅ Filters: All / Luminaries / Shadows / Archetypes
 * ✅ Node details panel on click
 *
 * API base:
 * - uses REACT_APP_API_BASE if set
 * - else defaults to http://localhost:5000
 */

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function safeStr(x) {
  return (x == null ? "" : String(x)).trim();
}

function shortLabel(s, max = 18) {
  const t = safeStr(s);
  if (!t) return "";
  return t.length > max ? t.slice(0, max) + "…" : t;
}

function nodeRadius(n) {
  const base =
    n.type === "star"
      ? 18
      : n.type === "luminary"
      ? 12
      : n.type === "shadow"
      ? 12
      : n.type === "archetype"
      ? 10
      : 10;

  const s = typeof n.size === "number" ? n.size : null;
  if (s == null) return base;
  return clamp(base + (s - 14) * 0.35, 8, 26);
}

function typeStroke(n) {
  if (n.type === "star") return "rgba(0,0,0,0.55)";
  if (n.type === "luminary") return "rgba(0,0,0,0.35)";
  if (n.type === "shadow") return "rgba(0,0,0,0.35)";
  if (n.type === "archetype") return "rgba(0,0,0,0.25)";
  return "rgba(0,0,0,0.2)";
}

function typeFill(n) {
  if (n.type === "star") return "rgba(0,0,0,0.06)";
  if (n.type === "luminary") return "rgba(0,0,0,0.03)";
  if (n.type === "shadow") return "rgba(0,0,0,0.03)";
  if (n.type === "archetype") return "rgba(0,0,0,0.02)";
  return "rgba(0,0,0,0.02)";
}

function cardStyle() {
  return {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 16,
    padding: 14,
    background: "rgba(255,255,255,0.72)",
    boxShadow: "0 18px 44px rgba(0,0,0,0.10)",
  };
}

function chipStyle(active) {
  return {
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.12)",
    background: active ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.78)",
    cursor: "pointer",
    fontSize: 13,
    userSelect: "none",
    fontWeight: 800,
  };
}

export default function ArchetypeConstellationGraph() {
  const q = useQuery();
  const initialProfileKey = q.get("profileKey") || "debug_profile";

  const [profileKey, setProfileKey] = useState(initialProfileKey);
  const [filter, setFilter] = useState("all"); // all | luminary | shadow | archetype

  const [data, setData] = useState(null);
  const [starName, setStarName] = useState("");
  const [renameDraft, setRenameDraft] = useState("");

  const [selectedNode, setSelectedNode] = useState(null);

  const [loading, setLoading] = useState(false);
  const [savingStar, setSavingStar] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

  // SVG refs
  const svgRef = useRef(null);
  const wrapRef = useRef(null);
  const simRef = useRef(null);

  const meta = data?.meta || {};
  const star = data?.star || {};
  const rawNodes = Array.isArray(data?.nodes) ? data.nodes : [];
  const rawEdges = Array.isArray(data?.edges) ? data.edges : [];

  const starSignature =
    safeStr(star?.signature) ||
    (star?.luminary || star?.shadow ? `${star?.luminary || "?"} ✶ ${star?.shadow || "?"}` : "");

  const starHeaderText = useMemo(() => {
    const nm = safeStr(starName);
    if (nm && starSignature) return `${nm} — ${starSignature}`;
    if (nm) return nm;
    if (starSignature) return starSignature;
    return "Not computed yet";
  }, [starName, starSignature]);

  async function loadConstellation() {
    setLoading(true);
    setErr("");
    setSelectedNode(null);

    try {
      const url = `${API_BASE}/api/constellation?profileKey=${encodeURIComponent(profileKey)}`;
      const r = await fetch(url);
      const json = await r.json().catch(() => ({}));
      if (!r.ok || json?.ok === false) throw new Error(json?.message || `Request failed (${r.status})`);

      setData(json);

      const nameFromPayload = safeStr(json?.star?.name);
      setStarName(nameFromPayload);
      setRenameDraft(nameFromPayload); // keep input synced to saved name
    } catch (e) {
      setErr(e?.message || "Failed to load constellation");
      setData(null);
      setStarName("");
      setRenameDraft("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConstellation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshAll() {
    await loadConstellation();
  }

  async function saveStarRename() {
    const pk = safeStr(profileKey);
    const cleaned = safeStr(renameDraft).slice(0, 48);
    if (!pk) {
      setToast("Missing profileKey.");
      window.setTimeout(() => setToast(""), 1200);
      return;
    }

    setSavingStar(true);
    setToast("");

    try {
      const r = await fetch(`${API_BASE}/api/star-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileKey: pk, starName: cleaned }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.ok === false) throw new Error(j?.message || "Save failed");

      setToast("Star renamed.");
      window.setTimeout(() => setToast(""), 1200);

      // refresh constellation so it returns the name on star node + payload
      await loadConstellation();
    } catch (e) {
      setToast(`Couldn’t rename: ${e?.message || "unknown error"}`);
      window.setTimeout(() => setToast(""), 1800);
    } finally {
      setSavingStar(false);
    }
  }

  // Build filtered nodes/edges for D3
  const filtered = useMemo(() => {
    const nodesIn = rawNodes.length ? rawNodes : [];
    const edgesIn = rawEdges.length ? rawEdges : [];

    // ensure star exists
    const starNode =
      nodesIn.find((n) => n.id === "star_core") ||
      nodesIn.find((n) => n.type === "star") ||
      null;

    const isWanted = (n) => {
      if (!n) return false;
      if (n.type === "star") return true;
      if (filter === "all") return true;
      return n.type === filter;
    };

    const nodes = nodesIn.filter(isWanted);

    // Ensure star included
    if (starNode && !nodes.some((n) => n.id === starNode.id)) nodes.unshift(starNode);

    // If backend did not provide star node, make one
    if (!starNode && !nodes.some((n) => n.id === "star_core")) {
      nodes.unshift({
        id: "star_core",
        type: "star",
        label: starName || "Your Star",
        name: starName || "",
        signature: starSignature || "",
        size: 18,
      });
    }

    // keep edges only between allowed nodes
    const allowed = new Set(nodes.map((n) => n.id));
    const edges = edgesIn.filter((e) => allowed.has(e.from) && allowed.has(e.to));

    // If empty, connect star -> each node (keeps layout stable early)
    const hasEdges = edges.length > 0;
    const finalEdges = hasEdges
      ? edges
      : nodes
          .filter((n) => n.id !== "star_core")
          .map((n) => ({ from: "star_core", to: n.id, weight: 1 }));

    return { nodes, edges: finalEdges };
  }, [rawNodes, rawEdges, filter, starName, starSignature]);

  // D3 render
  useEffect(() => {
    const svgEl = svgRef.current;
    const wrapEl = wrapRef.current;
    if (!svgEl || !wrapEl) return;

    // stop old sim
    if (simRef.current) {
      simRef.current.stop();
      simRef.current = null;
    }

    const width = wrapEl.clientWidth || 760;
    const height = 560;

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    // Background
    svg
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height)
      .attr("rx", 16)
      .attr("fill", "rgba(0,0,0,0.02)");

    const zoomLayer = svg.append("g").attr("class", "zoom-layer");

    // subtle dotted grid
    const grid = zoomLayer.append("g").attr("opacity", 0.28);
    const step = 36;
    for (let y = step; y < height; y += step) {
      for (let x = step; x < width; x += step) {
        grid.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 0.7)
          .attr("fill", "rgba(0,0,0,0.18)");
      }
    }

    // Copy nodes/links for D3 mutation
    const nodes = filtered.nodes.map((n) => ({ ...n }));
    const links = filtered.edges.map((e) => ({ ...e }));

    // Ensure star node uses latest name/signature
    const starNode = nodes.find((n) => n.id === "star_core" || n.type === "star");
    if (starNode) {
      starNode.__starName = safeStr(starName);
      starNode.__starSignature = safeStr(starSignature);
      starNode.label = starNode.__starName || safeStr(starNode.label) || "Your Star";
      starNode.name = starNode.__starName;
      starNode.signature = starNode.__starSignature;
    }

    // Map by id
    const idToNode = new Map(nodes.map((n) => [n.id, n]));

    const d3Links = links
      .map((l) => ({
        source: idToNode.get(l.from),
        target: idToNode.get(l.to),
        weight: typeof l.weight === "number" ? l.weight : 1,
      }))
      .filter((l) => l.source && l.target);

    // Links
    const link = zoomLayer
      .append("g")
      .attr("stroke", "rgba(0,0,0,0.22)")
      .attr("stroke-width", 1)
      .attr("opacity", 0.85)
      .selectAll("line")
      .data(d3Links)
      .join("line");

    // Nodes group
    const nodeG = zoomLayer
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "grab");

    // Node circles
    nodeG
      .append("circle")
      .attr("r", (d) => nodeRadius(d))
      .attr("fill", (d) => typeFill(d))
      .attr("stroke", (d) => typeStroke(d))
      .attr("stroke-width", (d) => (d.type === "star" ? 1.9 : 1.2));

    // Labels
    nodeG
      .append("text")
      .text((d) => {
        if (d.type === "star") {
          const nm = safeStr(d.__starName);
          const sig = safeStr(d.__starSignature);
          if (nm) return shortLabel(nm, 18);
          if (sig) return shortLabel(sig, 18);
          return "Your Star";
        }
        const label = safeStr(d.label || d.id)
          .replace(/^Luminary:\s*/i, "")
          .replace(/^Shadow:\s*/i, "")
          .replace(/^Archetype:\s*/i, "");
        return shortLabel(label, 18);
      })
      .attr("text-anchor", "middle")
      .attr("dy", (d) => nodeRadius(d) + 14)
      .attr("font-size", 11)
      .attr("fill", "rgba(0,0,0,0.82)")
      .attr("pointer-events", "none");

    // Hover ring
    nodeG
      .append("circle")
      .attr("r", (d) => nodeRadius(d) + 6)
      .attr("fill", "transparent")
      .attr("stroke", "rgba(0,0,0,0.14)")
      .attr("stroke-width", 1)
      .attr("opacity", 0);

    nodeG
      .on("mouseenter", function () {
        d3.select(this).selectAll("circle").filter((_, i) => i === 1).attr("opacity", 1);
        d3.select(this).attr("cursor", "pointer");
      })
      .on("mouseleave", function () {
        d3.select(this).selectAll("circle").filter((_, i) => i === 1).attr("opacity", 0);
        d3.select(this).attr("cursor", "grab");
      })
      .on("click", (_evt, d) => setSelectedNode(d));

    // Drag
    const drag = d3
      .drag()
      .on("start", (event, d) => {
        if (!event.active) sim.alphaTarget(0.18).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeG.call(drag);

    // Simulation
    const sim = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(d3Links)
          .id((d) => d.id)
          .distance((l) => {
            if (l.source.type === "star" || l.target.type === "star") return 92;
            return 120;
          })
          .strength(0.62)
      )
      .force("charge", d3.forceManyBody().strength(-260))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d) => nodeRadius(d) + 10).strength(0.92));

    // Pin star to center
    if (starNode) {
      starNode.fx = width / 2;
      starNode.fy = height / 2;
    }

    sim.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      nodeG.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Zoom/pan
    const zoom = d3.zoom().scaleExtent([0.4, 2.4]).on("zoom", (event) => zoomLayer.attr("transform", event.transform));
    svg.call(zoom);

    // Double-click to reset
    svg.on("dblclick.zoom", null);
    svg.on("dblclick", () => {
      svg.transition().duration(220).call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));
    });

    simRef.current = sim;

    // Resize handling
    const ro = new ResizeObserver(() => {
      const w = wrapEl.clientWidth || 760;
      svg.attr("viewBox", `0 0 ${w} ${height}`);
      sim.force("center", d3.forceCenter(w / 2, height / 2));
      if (starNode) {
        starNode.fx = w / 2;
        starNode.fy = height / 2;
      }
      sim.alpha(0.2).restart();
    });
    ro.observe(wrapEl);

    return () => {
      ro.disconnect();
      sim.stop();
    };
  }, [filtered, starName, starSignature]);

  const selectedDisplay = useMemo(() => {
    if (!selectedNode) return null;
    if (selectedNode.type === "star") {
      return {
        title: safeStr(starName) || "Your Star",
        subtitle: starSignature || "",
      };
    }
    return {
      title: safeStr(selectedNode.label) || selectedNode.id,
      subtitle: selectedNode.type || "",
    };
  }, [selectedNode, starName, starSignature]);

  return (
    <div style={{ padding: 18, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* LEFT */}
        <div style={{ flex: "1 1 740px", minWidth: 320 }}>
          <div style={{ ...cardStyle(), marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 0.2 }}>Constellation Map</div>
                <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
                  ProfileKey:{" "}
                  <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{profileKey}</span>
                </div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                  API:{" "}
                  <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{API_BASE}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  value={profileKey}
                  onChange={(e) => setProfileKey(e.target.value)}
                  placeholder="profileKey"
                  style={{
                    padding: "9px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.2)",
                    minWidth: 220,
                    background: "rgba(255,255,255,0.9)",
                  }}
                />
                <button
                  onClick={refreshAll}
                  style={{
                    padding: "9px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.2)",
                    background: "rgba(255,255,255,0.9)",
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                >
                  Refresh
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ ...cardStyle(), padding: 12, flex: "1 1 340px", background: "rgba(0,0,0,0.02)" }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Your Star</div>
                <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4 }}>{starHeaderText}</div>
                <div style={{ fontSize: 12, opacity: 0.72, marginTop: 6 }}>
                  Source: <b>{meta?.source || "unknown"}</b>
                  {meta?.suiteStatus ? ` · Suite: ${meta.suiteStatus}` : ""}
                  {typeof meta?.submissions === "number" ? ` · Submissions: ${meta.submissions}` : ""}
                </div>
              </div>

              <div style={{ ...cardStyle(), padding: 12, flex: "1 1 260px" }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Rename Star</div>
                <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    placeholder="Star name (max 48 chars)"
                    disabled={savingStar}
                    style={{
                      flex: "1 1 220px",
                      padding: "9px 10px",
                      borderRadius: 10,
                      border: "1px solid rgba(0,0,0,0.2)",
                      background: "rgba(255,255,255,0.9)",
                    }}
                  />
                  <button
                    onClick={saveStarRename}
                    disabled={savingStar}
                    style={{
                      padding: "9px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(0,0,0,0.2)",
                      background: savingStar ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.9)",
                      cursor: savingStar ? "not-allowed" : "pointer",
                      fontWeight: 900,
                    }}
                  >
                    {savingStar ? "Saving…" : "Save"}
                  </button>
                </div>
                {toast ? (
                  <div style={{ marginTop: 8, fontSize: 12, fontWeight: 900, opacity: 0.86 }}>{toast}</div>
                ) : null}
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div onClick={() => setFilter("all")} style={chipStyle(filter === "all")}>
                All
              </div>
              <div onClick={() => setFilter("luminary")} style={chipStyle(filter === "luminary")}>
                Luminaries
              </div>
              <div onClick={() => setFilter("shadow")} style={chipStyle(filter === "shadow")}>
                Shadows
              </div>
              <div onClick={() => setFilter("archetype")} style={chipStyle(filter === "archetype")}>
                Archetypes
              </div>
            </div>

            {loading && <div style={{ marginTop: 12, opacity: 0.75 }}>Loading constellation…</div>}
            {err && (
              <div style={{ marginTop: 12, padding: 10, borderRadius: 10, background: "rgba(220,0,0,0.06)" }}>
                <b>Error:</b> {err}
              </div>
            )}
          </div>

          {/* Graph */}
          <div ref={wrapRef} style={{ ...cardStyle(), padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 900 }}>Constellation Graph</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Nodes: <b>{filtered.nodes.length}</b> · Links: <b>{filtered.edges.length}</b>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <svg ref={svgRef} width="100%" height="560" style={{ display: "block" }} />
            </div>

            {!loading && !err && filtered.nodes.length <= 1 && (
              <div style={{ marginTop: 10, opacity: 0.75 }}>
                No constellation nodes yet for this profileKey — run the mini tests so the constellation has real nodes.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ flex: "0 0 360px", minWidth: 300 }}>
          <div style={cardStyle()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 900 }}>Node Details</div>
              <button
                onClick={() => setSelectedNode(null)}
                style={{
                  padding: "7px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.2)",
                  background: "rgba(255,255,255,0.9)",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                Clear
              </button>
            </div>

            {!selectedNode ? (
              <div style={{ marginTop: 12, opacity: 0.75, lineHeight: 1.5 }}>
                Click a node in the graph to see its details here.
              </div>
            ) : (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{selectedDisplay?.title}</div>

                {selectedDisplay?.subtitle ? (
                  <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>{selectedDisplay.subtitle}</div>
                ) : null}

                <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6 }}>
                  <div>
                    <span style={{ opacity: 0.7 }}>ID:</span>{" "}
                    <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                      {selectedNode.id}
                    </span>
                  </div>
                  <div>
                    <span style={{ opacity: 0.7 }}>Type:</span> <b>{selectedNode.type}</b>
                  </div>

                  {"score" in selectedNode && (
                    <div>
                      <span style={{ opacity: 0.7 }}>Score:</span> <b>{selectedNode.score}</b>
                    </div>
                  )}
                  {"size" in selectedNode && (
                    <div>
                      <span style={{ opacity: 0.7 }}>Size:</span> {selectedNode.size}
                    </div>
                  )}
                  {"tag" in selectedNode && selectedNode.tag && (
                    <div>
                      <span style={{ opacity: 0.7 }}>Tag:</span>{" "}
                      <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                        {selectedNode.tag}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 12, padding: 10, borderRadius: 12, background: "rgba(0,0,0,0.03)" }}>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    Next upgrade: add “Open Lore Entry” button (route to LoreEntryPage by tag/id).
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 14, ...cardStyle() }}>
            <div style={{ fontSize: 14, fontWeight: 900 }}>Next upgrades</div>
            <ul style={{ marginTop: 10, paddingLeft: 18, opacity: 0.9, lineHeight: 1.6 }}>
              <li>Hover tooltip (score + description)</li>
              <li>Legend + toggles (hide/show groups)</li>
              <li>“Open Lore Entry” deep link</li>
              <li>Export constellation snapshot</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
