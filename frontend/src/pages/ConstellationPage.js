// src/pages/ConstellationPage.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { Link } from "react-router-dom";

/**
 * Constellation Map v3 (Law-as-Attractor clustering):
 * - Load 400/900 toggle
 * - Color by entryType OR by law-attractor clusters (global)
 * - Cluster highlight: clicking a law highlights its FULL cluster (not radius)
 * - Export snapshot PNG
 * - Export narration transcript TXT
 */

export default function ConstellationPage() {
  const svgRef = useRef(null);
  const simRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [doc, setDoc] = useState(null);

  const [loadMode, setLoadMode] = useState("400"); // "400" | "900"
  const loadLimit = loadMode === "900" ? 900 : 400;

  const [selectedId, setSelectedId] = useState("");
  const [q, setQ] = useState("");

  // Global cluster modes
  const [clusterMode, setClusterMode] = useState("type"); // "type" | "law"
  const [highlightSet, setHighlightSet] = useState(new Set());
  const [highlightCenter, setHighlightCenter] = useState("");

  // Narration transcript (click-history)
  const [narrationLog, setNarrationLog] = useState([]);

  // Load lore doc
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch("/api/lore/entries");
        const json = await res.json();
        if (!alive) return;
        if (!json?.ok) throw new Error(json?.message || "Failed to load lore");
        setDoc(json.data);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Unknown error");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Node slice
  const nodes = useMemo(() => {
    const list = Array.isArray(doc?.nodes) ? doc.nodes : [];
    return list.slice(0, loadLimit).map((n) => ({
      id: n.id,
      title: n.title || n.id,
      entryType: n.entryType || "unknown",
      lore: n.lore || "",
      glyph: n.glyph || null,
      linkedNodes: Array.isArray(n.linkedNodes) ? n.linkedNodes : [],
      archId: n.archId || null,
      shadowReflection: n.shadowReflection || "",
    }));
  }, [doc, loadLimit]);

  const nodeById = useMemo(() => {
    const m = new Map();
    nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [nodes]);

  // Build links from linkedNodes (within visible slice)
  const links = useMemo(() => {
    const edges = [];
    const seen = new Set();
    for (const n of nodes) {
      for (const tgt of n.linkedNodes) {
        if (!nodeById.has(tgt)) continue;
        const a = n.id;
        const b = tgt;
        const key = a < b ? `${a}__${b}` : `${b}__${a}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push({ source: a, target: b });
      }
    }
    return edges;
  }, [nodes, nodeById]);

  const selected = selectedId ? nodeById.get(selectedId) : null;

  // Color by entryType (baseline)
  const typeColor = (entryType) => {
    switch (String(entryType || "").toLowerCase()) {
      case "cosmology":
        return "#2b3f63"; // deep blue
      case "law":
        return "#6a1c2f"; // oxblood
      case "archetype":
        return "#2d4a3a"; // forest
      default:
        return "#333333"; // ink
    }
  };

  // Stable per-string color (for clusters)
  function hashHue(str) {
    let h = 0;
    const s = String(str || "");
    for (let i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) >>> 0;
    }
    return h % 360;
  }
  function lawClusterColor(lawId) {
    if (!lawId || lawId === "unassigned") return "rgba(0,0,0,.28)";
    const hue = hashHue(lawId);
    // pleasant mid saturation/lightness
    return `hsl(${hue} 45% 38%)`;
  }

  // Adjacency map
  const adjacency = useMemo(() => {
    const adj = new Map();
    for (const n of nodes) adj.set(n.id, new Set());

    for (const e of links) {
      const s = typeof e.source === "string" ? e.source : e.source.id;
      const t = typeof e.target === "string" ? e.target : e.target.id;
      if (!adj.has(s)) adj.set(s, new Set());
      if (!adj.has(t)) adj.set(t, new Set());
      adj.get(s).add(t);
      adj.get(t).add(s);
    }
    return adj;
  }, [nodes, links]);

  // Identify law nodes (attractors)
  const lawIds = useMemo(() => {
    return nodes.filter((n) => String(n.entryType).toLowerCase() === "law").map((n) => n.id);
  }, [nodes]);

  /**
   * Law-as-attractor assignment (global):
   * Multi-source BFS: seed queue with all law nodes.
   * Each node gets assigned to the nearest law by hop count.
   * Tie-breaker: keep the first law that reaches it (stable by lawIds order).
   */
  const lawAssignment = useMemo(() => {
    const assign = new Map(); // nodeId -> lawId
    const dist = new Map(); // nodeId -> distance
    if (!lawIds.length) {
      // no laws visible => everyone unassigned
      for (const n of nodes) assign.set(n.id, "unassigned");
      return { assign, dist };
    }

    const q = [];
    // seed in stable order
    for (const lawId of lawIds) {
      assign.set(lawId, lawId);
      dist.set(lawId, 0);
      q.push(lawId);
    }

    while (q.length) {
      const cur = q.shift();
      const curLaw = assign.get(cur);
      const curD = dist.get(cur) ?? 0;

      const neigh = adjacency.get(cur) || new Set();
      for (const nxt of neigh) {
        if (!dist.has(nxt)) {
          dist.set(nxt, curD + 1);
          assign.set(nxt, curLaw);
          q.push(nxt);
        } else {
          // tie-break: if another law reaches with same distance, keep existing (stable)
          // if shorter distance found (unlikely in BFS), update
          const prevD = dist.get(nxt);
          if (curD + 1 < prevD) {
            dist.set(nxt, curD + 1);
            assign.set(nxt, curLaw);
            q.push(nxt);
          }
        }
      }
    }

    // fill unvisited nodes
    for (const n of nodes) {
      if (!assign.has(n.id)) assign.set(n.id, "unassigned");
    }

    return { assign, dist };
  }, [nodes, adjacency, lawIds]);

  const clusterStats = useMemo(() => {
    const counts = new Map(); // lawId -> count
    for (const n of nodes) {
      const k = lawAssignment.assign.get(n.id) || "unassigned";
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    // sort: laws by count desc, unassigned last
    const arr = Array.from(counts.entries())
      .sort((a, b) => {
        if (a[0] === "unassigned") return 1;
        if (b[0] === "unassigned") return -1;
        return b[1] - a[1];
      })
      .map(([lawId, count]) => ({
        lawId,
        count,
        title: lawId === "unassigned" ? "Unassigned" : (nodeById.get(lawId)?.title || lawId),
      }));
    return arr.slice(0, 10);
  }, [nodes, lawAssignment, nodeById]);

  function clearHighlight() {
    setHighlightCenter("");
    setHighlightSet(new Set());
  }

  function highlightClusterForLaw(lawId) {
    const hs = new Set();
    for (const n of nodes) {
      if ((lawAssignment.assign.get(n.id) || "unassigned") === lawId) hs.add(n.id);
    }
    setHighlightCenter(lawId);
    setHighlightSet(hs);
  }

  // Selection behavior + narration log
  function selectNode(id) {
    if (!id) return;
    const n = nodeById.get(id);
    if (!n) return;

    setSelectedId(id);

    setNarrationLog((prev) => {
      const exists = prev.some((x) => x.id === id);
      const entry = {
        id: n.id,
        title: n.title || n.id,
        entryType: n.entryType || "unknown",
        archId: n.archId || "",
        lore: n.lore || "",
        shadowReflection: n.shadowReflection || "",
        ts: Date.now(),
      };
      const next = exists ? prev.map((x) => (x.id === id ? entry : x)) : [entry, ...prev];
      return next.slice(0, 50);
    });

    // If cluster coloring is on, clicking a LAW highlights its entire assigned cluster
    if (clusterMode === "law" && String(n.entryType).toLowerCase() === "law") {
      highlightClusterForLaw(n.id);
    }
  }

  // D3 draw + update on nodes/links/highlight/clusterMode
  useEffect(() => {
    if (loading || err || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current?.clientWidth || 900;
    const height = 640;

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg.append("g");

    // zoom/pan
    svg.call(
      d3
        .zoom()
        .scaleExtent([0.2, 3])
        .on("zoom", (event) => g.attr("transform", event.transform))
    );

    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => {
        const s = typeof d.source === "string" ? d.source : d.source.id;
        const t = typeof d.target === "string" ? d.target : d.target.id;

        if (highlightSet.size > 0) {
          const inH = highlightSet.has(s) && highlightSet.has(t);
          return inH ? "rgba(0,0,0,.28)" : "rgba(0,0,0,.07)";
        }
        return "rgba(0,0,0,.16)";
      })
      .attr("stroke-width", (d) => {
        const s = typeof d.source === "string" ? d.source : d.source.id;
        const t = typeof d.target === "string" ? d.target : d.target.id;
        if (highlightSet.size > 0) return highlightSet.has(s) && highlightSet.has(t) ? 1.4 : 1;
        return 1;
      });

    const node = g
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => (String(d.entryType).toLowerCase() === "law" ? 7 : String(d.entryType).toLowerCase() === "archetype" ? 7 : 5.5))
      .attr("fill", (d) => {
        if (clusterMode === "law") {
          const lawId = lawAssignment.assign.get(d.id) || "unassigned";
          return lawClusterColor(lawId);
        }
        return typeColor(d.entryType);
      })
      .attr("stroke", (d) => {
        if (d.id === selectedId) return "rgba(255,255,255,.95)";
        if (highlightSet.size > 0 && highlightSet.has(d.id)) return "rgba(255,255,255,.9)";
        return "rgba(255,255,255,.75)";
      })
      .attr("stroke-width", (d) => {
        if (d.id === selectedId) return 2.2;
        if (highlightSet.size > 0 && highlightSet.has(d.id)) return 1.8;
        return 1.2;
      })
      .attr("opacity", (d) => {
        if (highlightSet.size > 0) return highlightSet.has(d.id) ? 1 : 0.18;
        return 1;
      })
      .style("cursor", "pointer")
      .on("click", (_, d) => selectNode(d.id))
      .call(
        d3
          .drag()
          .on("start", (event, d) => {
            if (!event.active) simRef.current.alphaTarget(0.25).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simRef.current.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Label only laws (works in both color modes)
    const label = g
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d) => (String(d.entryType).toLowerCase() === "law" ? d.title : ""))
      .attr("font-size", 10)
      .attr("opacity", (d) => {
        if (highlightSet.size > 0) return highlightSet.has(d.id) ? 0.7 : 0.0;
        return 0.55;
      })
      .attr("pointer-events", "none");

    const sim = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.id).distance(34).strength(0.65))
      .force("charge", d3.forceManyBody().strength(-70))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(10.5));

    sim.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

      label.attr("x", (d) => d.x + 10).attr("y", (d) => d.y + 4);
    });

    simRef.current = sim;

    return () => sim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, err, nodes, links, selectedId, highlightSet, clusterMode, lawAssignment]);

  // Search jump
  const searchHits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return nodes.filter((n) => `${n.id} ${n.title}`.toLowerCase().includes(s)).slice(0, 10);
  }, [q, nodes]);

  function jumpTo(id) {
    if (nodeById.has(id)) selectNode(id);
  }

  // Export: Snapshot PNG
  async function exportSnapshotPng() {
    try {
      const svgEl = svgRef.current;
      if (!svgEl) return;

      const cloned = svgEl.cloneNode(true);
      const vb = cloned.getAttribute("viewBox") || "0 0 900 640";
      const [x, y, w, h] = vb.split(" ").map(Number);

      const standalone = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      standalone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      standalone.setAttribute("width", String(w));
      standalone.setAttribute("height", String(h));
      standalone.setAttribute("viewBox", vb);

      const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bg.setAttribute("x", String(x));
      bg.setAttribute("y", String(y));
      bg.setAttribute("width", String(w));
      bg.setAttribute("height", String(h));
      bg.setAttribute("fill", "#f7f2e8");
      standalone.appendChild(bg);

      while (cloned.childNodes.length) standalone.appendChild(cloned.childNodes[0]);

      const serializer = new XMLSerializer();
      const svgText = serializer.serializeToString(standalone);
      const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to render SVG"));
        img.src = url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `constellation_${clusterMode}_${loadLimit}_${Date.now()}.png`;
      a.click();
    } catch (e) {
      alert(e?.message || "Snapshot export failed");
    }
  }

  // Export: Narration transcript TXT
  function exportTranscriptTxt() {
    const lines = [];
    lines.push(`Constellation Narration Transcript`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Loaded nodes: ${loadLimit}`);
    lines.push(`Color mode: ${clusterMode}`);
    if (highlightCenter) lines.push(`Highlighted cluster: ${highlightCenter}`);
    lines.push("");

    if (!narrationLog.length) {
      lines.push("(No narration clicks yet.)");
    } else {
      for (const n of narrationLog.slice().reverse()) {
        lines.push(`—`);
        lines.push(`${n.title} (${n.id})`);
        lines.push(`Type: ${n.entryType}${n.archId ? ` • Arch: ${n.archId}` : ""}`);
        lines.push(`Time: ${new Date(n.ts).toLocaleString()}`);
        lines.push("");
        if (n.lore) {
          lines.push("Lore:");
          lines.push(n.lore);
          lines.push("");
        }
        if (n.shadowReflection) {
          lines.push("Shadow reflection:");
          lines.push(n.shadowReflection);
          lines.push("");
        }
      }
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `narration_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const canExport = !loading && !err && nodes.length > 0;

  return (
    <div style={styles.wrap}>
      <div style={styles.top}>
        <div>
          <h2 style={{ margin: 0 }}>Constellation Map</h2>
          <div style={{ opacity: 0.7, marginTop: 6, fontSize: 13 }}>
            Showing {nodes.length} nodes • {links.length} links • load: {loadMode} • mode: {clusterMode === "law" ? "Law attractors" : "Entry types"}
          </div>
        </div>

        <div style={styles.controlsRow}>
          <div style={styles.search}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search node id/title…" style={styles.input} />
            {searchHits.length ? (
              <div style={styles.dropdown}>
                {searchHits.map((h) => (
                  <button key={h.id} style={styles.hit} onClick={() => jumpTo(h.id)}>
                    <span style={{ fontWeight: 750 }}>{h.title}</span>
                    <span style={{ opacity: 0.7, marginLeft: 8 }}>{h.id}</span>
                    <span style={{ opacity: 0.55, marginLeft: 8 }}>({h.entryType})</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div style={styles.btnRow}>
            <button
              style={styles.btnGhost}
              onClick={() => {
                setLoadMode((m) => (m === "900" ? "400" : "900"));
                clearHighlight();
              }}
              title="Toggle node load size"
            >
              Load {loadMode === "900" ? "400" : "900"}
            </button>

            <button
              style={clusterMode === "law" ? styles.btnPrimary : styles.btnGhost}
              onClick={() => {
                setClusterMode((m) => (m === "law" ? "type" : "law"));
                clearHighlight();
              }}
              title="Color the entire graph by nearest Law node (attractor clusters)"
            >
              Law clusters: {clusterMode === "law" ? "ON" : "OFF"}
            </button>

            <button style={styles.btnGhost} onClick={clearHighlight} title="Clear highlight">
              Clear highlight
            </button>

            <button style={styles.btnGhost} onClick={exportSnapshotPng} disabled={!canExport}>
              Export snapshot
            </button>

            <button style={styles.btnGhost} onClick={exportTranscriptTxt} disabled={!canExport}>
              Export transcript
            </button>
          </div>
        </div>
      </div>

      {loading ? <p>Loading…</p> : null}
      {err ? <p style={{ color: "#a33" }}>{err}</p> : null}

      <div style={styles.body}>
        <div style={styles.mapCard}>
          <svg ref={svgRef} style={styles.svg} />
          <div style={styles.mapHint}>Drag nodes • Scroll zoom • Click nodes to narrate • Click LAW to highlight its full cluster</div>

          <div style={styles.legend}>
            {clusterMode === "type" ? (
              <>
                <div style={styles.legendRow}><span style={{ ...styles.dot, background: typeColor("cosmology") }} /> Cosmology</div>
                <div style={styles.legendRow}><span style={{ ...styles.dot, background: typeColor("law") }} /> Law</div>
                <div style={styles.legendRow}><span style={{ ...styles.dot, background: typeColor("archetype") }} /> Archetype</div>
                <div style={styles.legendRow}><span style={{ ...styles.dot, background: typeColor("unknown") }} /> Other</div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Top attractors</div>
                {clusterStats.map((c) => (
                  <button
                    key={c.lawId}
                    style={{
                      ...styles.clusterRowBtn,
                      outline: highlightCenter === c.lawId ? "2px solid rgba(0,0,0,.35)" : "none",
                    }}
                    onClick={() => {
                      if (c.lawId !== "unassigned") {
                        highlightClusterForLaw(c.lawId);
                        selectNode(c.lawId);
                      }
                    }}
                    title="Click to highlight this cluster"
                  >
                    <span style={{ ...styles.dot, background: lawClusterColor(c.lawId) }} />
                    <span style={{ fontWeight: 750 }}>{c.title}</span>
                    <span style={{ opacity: 0.7, marginLeft: 8 }}>{c.count}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        <div style={styles.side}>
          <div style={styles.sideCard}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <strong>Narration</strong>
              <Link to="/lore/entries" style={styles.link}>Open Library →</Link>
            </div>

            {!selected ? (
              <p style={{ opacity: 0.75, marginTop: 10 }}>Click a node to read its lore and follow its linkedNodes.</p>
            ) : (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 850, fontSize: 16 }}>{selected.title}</div>
                    <div style={{ opacity: 0.7, fontSize: 12, marginTop: 4 }}>
                      <code style={styles.code}>{selected.id}</code> • {selected.entryType}
                      {selected.archId ? ` • ${selected.archId}` : ""}
                      {clusterMode === "law" ? ` • cluster: ${lawAssignment.assign.get(selected.id) || "unassigned"}` : ""}
                      {highlightCenter && selected.id === highlightCenter ? " • (highlight center)" : ""}
                    </div>
                  </div>
                  {selected.glyph?.sigil ? <pre style={styles.sigil}>{selected.glyph.sigil}</pre> : null}
                </div>

                {selected.lore ? <div style={styles.lore}>{selected.lore}</div> : null}

                {selected.shadowReflection ? (
                  <div style={styles.shadow}>
                    <strong>Shadow reflection</strong>
                    <div style={{ marginTop: 6 }}>{selected.shadowReflection}</div>
                  </div>
                ) : null}

                <div style={{ marginTop: 12 }}>
                  <strong>linkedNodes</strong>
                  <div style={styles.pills}>
                    {(selected.linkedNodes || [])
                      .filter((nid) => nodeById.has(nid))
                      .slice(0, 24)
                      .map((nid) => (
                        <button key={nid} style={styles.pillBtn} onClick={() => selectNode(nid)}>
                          {nid}
                        </button>
                      ))}
                    {(selected.linkedNodes || []).length > 24 ? <span style={{ opacity: 0.7 }}>…</span> : null}
                  </div>
                </div>

                {clusterMode === "law" && String(selected.entryType).toLowerCase() === "law" ? (
                  <div style={{ marginTop: 12 }}>
                    <button style={styles.btnGhost} onClick={() => highlightClusterForLaw(selected.id)}>
                      Highlight this cluster
                    </button>
                  </div>
                ) : null}

                <div style={{ marginTop: 12 }}>
                  <Link to={`/lore/entry/${encodeURIComponent(selected.id)}`} style={styles.openEntry}>
                    Open entry page →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div style={styles.sideCard}>
            <strong>Transcript buffer</strong>
            <div style={{ marginTop: 8, opacity: 0.8, fontSize: 13, lineHeight: 1.5 }}>
              Clicked nodes saved: <strong>{narrationLog.length}</strong> (max 50). Export anytime.
            </div>

            {narrationLog.length ? (
              <div style={{ marginTop: 10 }}>
                {narrationLog.slice(0, 6).map((n) => (
                  <div key={n.id} style={styles.logRow}>
                    <button style={styles.logBtn} onClick={() => selectNode(n.id)}>
                      <span style={{ ...styles.logDot, background: clusterMode === "law" ? lawClusterColor(lawAssignment.assign.get(n.id)) : typeColor(n.entryType) }} />
                      <span style={{ fontWeight: 750 }}>{n.title}</span>
                      <span style={{ opacity: 0.65, marginLeft: 8 }}>{n.id}</span>
                    </button>
                  </div>
                ))}
                {narrationLog.length > 6 ? <div style={{ opacity: 0.65, fontSize: 12 }}>…</div> : null}
              </div>
            ) : (
              <div style={{ marginTop: 10, opacity: 0.65, fontSize: 13 }}>No clicks yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 1200, margin: "0 auto", padding: 18 },

  top: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" },
  controlsRow: { display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" },

  search: { position: "relative", minWidth: 320 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,.18)" },
  dropdown: {
    position: "absolute",
    top: 44,
    left: 0,
    right: 0,
    border: "1px solid rgba(0,0,0,.14)",
    borderRadius: 12,
    background: "white",
    overflow: "hidden",
    zIndex: 5,
  },
  hit: { width: "100%", textAlign: "left", padding: "10px 12px", border: "none", background: "transparent", cursor: "pointer" },

  btnRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  btnGhost: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,.18)",
    background: "rgba(255,255,255,.7)",
    cursor: "pointer",
    fontWeight: 700,
  },
  btnPrimary: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,.22)",
    background: "rgba(0,0,0,.85)",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
  },

  body: { display: "grid", gridTemplateColumns: "1.4fr 0.9fr", gap: 12, marginTop: 12, alignItems: "start" },

  mapCard: {
    position: "relative",
    border: "1px solid rgba(0,0,0,.12)",
    borderRadius: 18,
    overflow: "hidden",
    background: "rgba(255,255,255,.75)",
  },
  svg: { width: "100%", height: 640, display: "block" },
  mapHint: {
    position: "absolute",
    bottom: 10,
    left: 12,
    fontSize: 12,
    opacity: 0.7,
    background: "rgba(255,255,255,.7)",
    padding: "6px 10px",
    borderRadius: 999,
  },

  legend: {
    position: "absolute",
    top: 10,
    left: 12,
    border: "1px solid rgba(0,0,0,.12)",
    background: "rgba(255,255,255,.8)",
    padding: 10,
    borderRadius: 14,
    fontSize: 12,
    opacity: 0.95,
    minWidth: 220,
  },
  legendRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  dot: { width: 10, height: 10, borderRadius: 999, display: "inline-block" },

  clusterRowBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    padding: "8px 8px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,.10)",
    background: "rgba(255,255,255,.85)",
    cursor: "pointer",
    textAlign: "left",
  },

  side: { display: "flex", flexDirection: "column", gap: 12 },
  sideCard: { border: "1px solid rgba(0,0,0,.12)", borderRadius: 18, padding: 14, background: "rgba(255,255,255,.75)" },
  link: { color: "inherit", textDecoration: "none", opacity: 0.85 },

  code: { fontSize: 12, padding: "2px 6px", borderRadius: 8, background: "rgba(0,0,0,.04)" },
  sigil: { margin: 0, padding: 10, borderRadius: 14, border: "1px solid rgba(0,0,0,.10)", background: "rgba(0,0,0,.03)", lineHeight: "12px", fontSize: 12 },
  lore: { marginTop: 12, lineHeight: 1.6, fontSize: 14, opacity: 0.95 },
  shadow: { marginTop: 12, padding: 12, borderRadius: 14, background: "rgba(0,0,0,.04)", fontSize: 13, lineHeight: 1.5 },

  pills: { marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 },
  pillBtn: { padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(0,0,0,.14)", background: "white", cursor: "pointer", fontSize: 12 },
  openEntry: { display: "inline-block", textDecoration: "none", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,.14)", background: "rgba(0,0,0,.03)", color: "inherit", fontWeight: 750 },

  logRow: { marginBottom: 8 },
  logBtn: { width: "100%", textAlign: "left", padding: "10px 10px", borderRadius: 12, border: "1px solid rgba(0,0,0,.12)", background: "white", cursor: "pointer" },
  logDot: { width: 10, height: 10, borderRadius: 999, display: "inline-block", marginRight: 10 },
};
