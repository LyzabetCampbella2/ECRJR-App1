import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../api/apiClient";

export default function Constellation() {
  const profileId = localStorage.getItem("eirden_profile");

  const [results, setResults] = useState({});
  const [selectedTestId, setSelectedTestId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================
     LOAD RESULTS
     ========================= */
  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    apiGet(`/api/tests/results/${profileId}`)
      .then((res) => {
        const r = res.results || {};
        setResults(r);

        const first = Object.keys(r)[0];
        if (first) setSelectedTestId(first);
      })
      .catch((e) => setError(e.message || "Failed to load constellation"))
      .finally(() => setLoading(false));
  }, [profileId]);

  const entries = useMemo(() => Object.entries(results), [results]);

  if (!profileId) return <p style={{ padding: 12 }}>No profile loaded.</p>;
  if (loading) return <p style={{ padding: 12 }}>Constellation forming…</p>;
  if (error) return <p style={{ padding: 12, color: "crimson" }}>{error}</p>;
  if (entries.length === 0)
    return <p style={{ padding: 12 }}>No constellation yet.</p>;

  /* =========================
     SVG GEOMETRY
     ========================= */
  const size = 520;
  const center = size / 2;
  const radius = 190;

  const nodes = entries.map(([testId, result], i) => {
    const angle = (2 * Math.PI * i) / entries.length - Math.PI / 2;
    return {
      testId,
      result,
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    };
  });

  const selectedNode =
    nodes.find((n) => n.testId === selectedTestId) || nodes[0];

  return (
    <div style={{ padding: 24 }}>
      <h2>Constellation</h2>

      <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
        {/* =========================
            SVG
           ========================= */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            background: "#fafafa"
          }}
        >
          {/* Connections */}
          {nodes.map((node, i) => {
            const next = nodes[(i + 1) % nodes.length];
            return (
              <line
                key={`line-${i}`}
                x1={node.x}
                y1={node.y}
                x2={next.x}
                y2={next.y}
                stroke="#bbb"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const selected = node.testId === selectedTestId;

            return (
              <g
                key={node.testId}
                onClick={() => setSelectedTestId(node.testId)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={22}
                  fill={selected ? "#222" : "#fff"}
                  stroke="#222"
                  strokeWidth="2"
                  style={{
                    filter: "drop-shadow(0 0 6px rgba(0,0,0,0.2))"
                  }}
                />
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill={selected ? "#fff" : "#222"}
                >
                  {node.result.primary}
                </text>
              </g>
            );
          })}

          <circle cx={center} cy={center} r={8} fill="#222" />
        </svg>

        {/* =========================
            ARCHETYPE PANEL
           ========================= */}
        <div style={{ flex: 1, minWidth: 320 }}>
          <ArchetypePanel
            testId={selectedNode.testId}
            result={selectedNode.result}
          />
        </div>
      </div>
    </div>
  );
}

/* =========================
   ARCHETYPE PANEL
   ========================= */
function ArchetypePanel({ testId, result }) {
  if (!result) return null;

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 14,
        padding: 20
      }}
    >
      <h3 style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {testId}
      </h3>

      <p style={{ fontSize: 22, fontWeight: 700 }}>{result.primary}</p>

      {result.secondary && (
        <p style={{ color: "#666" }}>{result.secondary}</p>
      )}

      {result.overview && <p>{result.overview}</p>}

      <a
        href={`/lore/${encodeURIComponent(result.primary)}`}
        style={{ display: "inline-block", marginTop: 8 }}
      >
        Read Archetype Lore →
      </a>

      {result.flags && result.flags.length > 0 && (
        <p style={{ color: "darkred", marginTop: 12 }}>
          <b>Flags:</b> {result.flags.join(", ")}
        </p>
      )}
    </div>
  );
}
