import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import catalog from "../data/archetypesCatalog.json";
import "./archetypeConstellation.css";

const byIdMap = (arr) => new Map(arr.map(e => [e.id, e]));

function getNeighbors(entry) {
  const links = entry?.links || {};
  const evo = links.evolutions || { from: [], to: [] };

  return {
    opposites: links.opposites || [],
    allies: links.allies || [],
    from: evo.from || [],
    to: evo.to || []
  };
}

function buildSubgraph(startId, byId, depth = 1) {
  const nodes = new Map();
  const edges = [];

  function addNode(id) {
    const e = byId.get(id);
    if (!e) return null;
    if (!nodes.has(id)) nodes.set(id, e);
    return e;
  }

  function addEdge(a, b, type) {
    if (!byId.has(a) || !byId.has(b)) return;
    edges.push({ a, b, type });
  }

  const start = addNode(startId);
  if (!start) return { nodes: [], edges: [] };

  const frontier = [{ id: startId, d: 0 }];
  const seen = new Set([startId]);

  while (frontier.length) {
    const { id, d } = frontier.shift();
    const entry = byId.get(id);
    if (!entry) continue;

    const n = getNeighbors(entry);

    const typed = [
      ["opposites", n.opposites],
      ["allies", n.allies],
      ["from", n.from],
      ["to", n.to]
    ];

    for (const [type, list] of typed) {
      for (const otherId of list) {
        addNode(otherId);
        addEdge(id, otherId, type);

        if (d + 1 <= depth && !seen.has(otherId)) {
          seen.add(otherId);
          frontier.push({ id: otherId, d: d + 1 });
        }
      }
    }
  }

  return { nodes: Array.from(nodes.values()), edges };
}

function radialLayout(centerId, nodes) {
  // center + rings by “hop distance” inferred from presence in set (simple)
  const center = nodes.find(n => n.id === centerId);
  const others = nodes.filter(n => n.id !== centerId);

  const W = 900, H = 520;
  const cx = W / 2, cy = H / 2;

  // group by family to spread aesthetically
  const groups = new Map();
  for (const n of others) {
    const k = n.family || "Unassigned";
    groups.set(k, (groups.get(k) || 0) + 1);
  }
  const families = Array.from(groups.keys()).sort();

  // place others around a circle
  const R = 190;
  const placed = new Map();
  placed.set(centerId, { x: cx, y: cy });

  const total = others.length || 1;
  let i = 0;
  for (const fam of families) {
    const famNodes = others.filter(n => (n.family || "Unassigned") === fam);
    for (const n of famNodes) {
      const angle = (2 * Math.PI * i) / total - Math.PI / 2;
      const jitter = (i % 3) * 8;
      placed.set(n.id, { x: cx + (R + jitter) * Math.cos(angle), y: cy + (R - jitter) * Math.sin(angle) });
      i++;
    }
  }

  return { W, H, placed };
}

export default function ArchetypeConstellation() {
  const all = Array.isArray(catalog) ? catalog : (catalog?.entries || []);
  const byId = useMemo(() => byIdMap(all), [all]);
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState(all?.[0]?.id || "arch_001");
  const [depth, setDepth] = useState(1);
  const [show, setShow] = useState({ opposites: true, allies: true, from: true, to: true });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return all.slice(0, 30);
    return all.filter(e =>
      `${e.id} ${e.name} ${(e.tags || []).join(" ")} ${(e.family || "")}`.toLowerCase().includes(query)
    ).slice(0, 50);
  }, [all, q]);

  const graph = useMemo(() => buildSubgraph(selectedId, byId, depth), [selectedId, byId, depth]);
  const layout = useMemo(() => radialLayout(selectedId, graph.nodes), [selectedId, graph.nodes]);

  const center = byId.get(selectedId);

  const edges = graph.edges.filter(e => show[e.type] !== false);

  return (
    <div className="constPage">
      <header className="constHeader">
        <div>
          <h1>Constellation</h1>
          <p className="constSub">Click a node to re-center. Depth 1–2 stays fast at 900+ archetypes.</p>
        </div>
        <div className="constHeaderRight">
          <Link className="constBtn" to={`/archetypes/${selectedId}`}>Open Lore</Link>
        </div>
      </header>

      <section className="constControls">
        <input
          className="constSearch"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search archetypes… (id / name / tags / family)"
        />

        <div className="constPickRow">
          <div className="constPick">
            <div className="label">Center</div>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {filtered.map(e => (
                <option key={e.id} value={e.id}>
                  {e.id} — {e.name}
                </option>
              ))}
            </select>
          </div>

          <div className="constPick">
            <div className="label">Depth</div>
            <select value={depth} onChange={(e) => setDepth(Number(e.target.value))}>
              <option value={1}>1 hop</option>
              <option value={2}>2 hops</option>
            </select>
          </div>

          <div className="constToggles">
            {["opposites", "allies", "from", "to"].map(k => (
              <label key={k} className="toggle">
                <input
                  type="checkbox"
                  checked={show[k]}
                  onChange={(e) => setShow(s => ({ ...s, [k]: e.target.checked }))}
                />
                <span>{k}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="constCanvasWrap">
        <div className="constSide">
          <div className="sideCard">
            <div className="sideTitle">{center?.name || selectedId}</div>
            <div className="sideMeta">
              <span className="pill">{selectedId}</span>
              {center?.family && <span className="pill">{center.family}</span>}
              {center?.tier && <span className="pill">{center.tier}</span>}
            </div>
            {center?.lore?.oneLiner && <p className="sideLine">{center.lore.oneLiner}</p>}
            <button className="constBtn" onClick={() => nav(`/archetypes/${selectedId}`)}>Open Lore Page</button>
          </div>

          <div className="sideCard">
            <div className="sideTitle">Nodes</div>
            <div className="sideList">
              {graph.nodes.slice(0, 40).map(n => (
                <button
                  key={n.id}
                  className={`sideItem ${n.id === selectedId ? "active" : ""}`}
                  onClick={() => setSelectedId(n.id)}
                >
                  <span className="mono">{n.id}</span>
                  <span className="name">{n.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="constCanvas">
          <svg viewBox={`0 0 ${layout.W} ${layout.H}`} className="svg">
            {/* edges */}
            {edges.map((e, idx) => {
              const a = layout.placed.get(e.a);
              const b = layout.placed.get(e.b);
              if (!a || !b) return null;
              return (
                <line
                  key={`${e.a}-${e.b}-${idx}`}
                  x1={a.x} y1={a.y}
                  x2={b.x} y2={b.y}
                  className={`edge edge-${e.type}`}
                />
              );
            })}

            {/* nodes */}
            {graph.nodes.map(n => {
              const p = layout.placed.get(n.id);
              if (!p) return null;
              const isCenter = n.id === selectedId;
              return (
                <g
                  key={n.id}
                  className={`node ${isCenter ? "center" : ""}`}
                  onClick={() => setSelectedId(n.id)}
                  role="button"
                >
                  <circle cx={p.x} cy={p.y} r={isCenter ? 18 : 12} className="dot" />
                  <text x={p.x} y={p.y + (isCenter ? 34 : 28)} textAnchor="middle" className="label">
                    {n.name?.length > 18 ? n.name.slice(0, 18) + "…" : n.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </section>
    </div>
  );
}
