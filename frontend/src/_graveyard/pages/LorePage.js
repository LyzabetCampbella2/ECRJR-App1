// src/pages/LorePage.js
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet } from "../apiClient";

function prettyId(id) {
  return String(id || "").replace(/^lumi_/i, "").replace(/^shadow_/i, "").replace(/_/g, " ").trim();
}
function safeText(x) {
  if (x == null) return "";
  if (typeof x === "string") return x;
  try { return JSON.stringify(x); } catch { return String(x); }
}

export default function LorePage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [item, setItem] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true); setError("");
        const res = await apiGet(`/api/lore/lumi-shadow/${id}`);
        if (!alive) return;
        setItem(res.item || null);
        setLoading(false);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Failed to load lore entry.");
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const kind = item?.kind || (String(id).startsWith("shadow_") ? "shadow" : "luminary");
  const pillClass = kind === "luminary" ? "pill is-forest" : kind === "shadow" ? "pill is-oxblood" : "pill";

  const cw = item?.counterweights || {};
  const stabilizers = useMemo(() => {
    if (kind === "shadow") return cw.stabilizingLuminaries || [];
    return cw.bestLuminaries || [];
  }, [cw, kind]);

  const watch = useMemo(() => {
    if (kind === "luminary") return cw.bestShadowsToWatch || [];
    if (cw.shadowToWatch) return [cw.shadowToWatch];
    return [];
  }, [cw, kind]);

  if (loading) {
    return (
      <div className="card">
        <div className="card-title">Loading lore…</div>
        <p className="card-meta">{safeText(id)}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-title">Lore</div>
        <p style={{ color: "crimson" }}>{error}</p>
        <Link className="btn" to="/lore">Back to Lore Index</Link>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="card">
        <div className="card-title">Not found</div>
        <p className="card-meta">{safeText(id)}</p>
        <Link className="btn" to="/lore">Back to Lore Index</Link>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span className={pillClass}>{kind.toUpperCase()}</span>
          {item.name || prettyId(item.id)}
        </div>
        <div className="card-meta">{item.id}</div>
      </div>

      {item.essence && <p className="card-meta">{item.essence}</p>}
      {item.mantra && <p style={{ fontWeight: 900, marginTop: 10 }}>“{item.mantra}”</p>}
      {item.shortLore && <p style={{ marginTop: 10 }}>{item.shortLore}</p>}

      {Array.isArray(item.lore) && item.lore.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {item.lore.map((p, i) => <p key={i} style={{ marginTop: i ? 8 : 0 }}>{safeText(p)}</p>)}
        </div>
      )}

      <div className="hr" />

      <div className="grid">
        <div className="card" style={{ boxShadow: "none" }}>
          <div className="card-title">Gifts</div>
          <ul style={{ marginTop: 10 }}>
            {(item.gifts || []).map((g, i) => <li key={i}>{safeText(g)}</li>)}
          </ul>
        </div>

        <div className="card" style={{ boxShadow: "none" }}>
          <div className="card-title">Risks</div>
          <ul style={{ marginTop: 10 }}>
            {(item.risks || []).map((r, i) => <li key={i}>{safeText(r)}</li>)}
          </ul>
        </div>
      </div>

      {kind === "shadow" && Array.isArray(item.triggers) && item.triggers.length > 0 && (
        <>
          <div className="hr" />
          <div className="card" style={{ boxShadow: "none" }}>
            <div className="card-title">Triggers</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              {item.triggers.map((t, i) => (
                <span key={i} className="pill is-oxblood">{safeText(t)}</span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Academic lenses */}
      <div className="hr" />

      <details>
        <summary className="card-meta" style={{ cursor: "pointer" }}>Psychological lens</summary>
        <div style={{ marginTop: 10 }}>
          <p><b>Core drive:</b> {safeText(item.psychology?.coreDrive)}</p>
          <p><b>Core fear:</b> {safeText(item.psychology?.coreFear)}</p>
          <p><b>Protective function:</b> {safeText(item.psychology?.protectiveFunction)}</p>
          <p><b>Attachment pattern:</b> {safeText(item.psychology?.attachmentPattern)}</p>
          <p><b>Nervous system bias:</b> {safeText(item.psychology?.nervousSystemBias)}</p>
        </div>
      </details>

      <details style={{ marginTop: 10 }}>
        <summary className="card-meta" style={{ cursor: "pointer" }}>Sociological lens</summary>
        <div style={{ marginTop: 10 }}>
          <p><b>Roles:</b> {(item.sociology?.roles || []).map(safeText).join(", ")}</p>
          <p><b>Modern manifestations:</b> {(item.sociology?.modernManifestations || []).map(safeText).join(", ")}</p>
          <p><b>Social reward:</b> {safeText(item.sociology?.socialReward)}</p>
          <p><b>Social cost:</b> {safeText(item.sociology?.socialCost)}</p>
        </div>
      </details>

      <details style={{ marginTop: 10 }}>
        <summary className="card-meta" style={{ cursor: "pointer" }}>Anthropological lens</summary>
        <div style={{ marginTop: 10 }}>
          <p><b>Historical echoes:</b> {(item.anthropology?.historicalEchoes || []).map(safeText).join(", ")}</p>
          <p><b>Mythic parallels:</b> {(item.anthropology?.mythicParallels || []).map(safeText).join(", ")}</p>
          <p><b>Cultural variants:</b> {(item.anthropology?.culturalVariants || []).map(safeText).join(", ")}</p>
        </div>
      </details>

      <details style={{ marginTop: 10 }}>
        <summary className="card-meta" style={{ cursor: "pointer" }}>Pedagogy</summary>
        <div style={{ marginTop: 10 }}>
          <p><b>Teaches:</b> {safeText(item.pedagogy?.teaches)}</p>
          <p><b>Learns best through:</b> {(item.pedagogy?.learnsBestThrough || []).map(safeText).join(", ")}</p>
          <p><b>Integration practices:</b></p>
          <ul>
            {(item.pedagogy?.integrationPractices || []).map((p, i) => <li key={i}>{safeText(p)}</li>)}
          </ul>
        </div>
      </details>

      <details style={{ marginTop: 10 }}>
        <summary className="card-meta" style={{ cursor: "pointer" }}>Developmental arc</summary>
        <div style={{ marginTop: 10 }}>
          <p><b>Early:</b> {safeText(item.development?.earlyExpression)}</p>
          <p><b>Mature:</b> {safeText(item.development?.matureExpression)}</p>
          <p><b>Integrated:</b> {safeText(item.development?.integratedExpression)}</p>
        </div>
      </details>

      {/* D) Shadow Integration Path */}
      <div className="hr" />
      <div className="card" style={{ boxShadow: "none" }}>
        <div className="card-title">Integration Path</div>
        <p className="card-meta">
          {kind === "shadow"
            ? "Use these steps to turn the shadow into signal, then into skill."
            : "Use these steps to embody the luminary without over-tightening into rigidity."}
        </p>

        <ol style={{ marginTop: 10 }}>
          <li><b>Name it:</b> {safeText(item.psychology?.coreFear || "Identify the fear underneath the pattern.")}</li>
          <li><b>Body reset:</b> {safeText(item.psychology?.nervousSystemBias || "Regulate first; decide second.")}</li>
          <li><b>One practice today:</b> {safeText((item.pedagogy?.integrationPractices || [])[0] || "Choose a single low-stakes action.")}</li>
          <li><b>Arc focus:</b> Move from <i>{safeText(item.development?.earlyExpression)}</i> → <i>{safeText(item.development?.matureExpression)}</i>.</li>
          <li><b>Integrated behavior:</b> {safeText(item.development?.integratedExpression || "Act from the integrated expression.")}</li>
        </ol>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <Link className="btn" to={`/dossier/${item.id}`}>Printable Dossier</Link>
          <Link className="btn" to="/lore">Back to Lore Index</Link>
        </div>
      </div>

      {/* Counterweights */}
      {(stabilizers.length > 0 || watch.length > 0) && (
        <>
          <div className="hr" />
          <div className="grid">
            {stabilizers.length > 0 && (
              <div className="card" style={{ boxShadow: "none" }}>
                <div className="card-title">{kind === "shadow" ? "Stabilizers" : "Counterweights"}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  {stabilizers.map((x) => (
                    <Link key={x} to={`/lore/${x}`} className="pill is-forest" style={{ textDecoration: "none" }}>
                      {prettyId(x)}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {watch.length > 0 && (
              <div className="card" style={{ boxShadow: "none" }}>
                <div className="card-title">Shadows to watch</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  {watch.map((x) => (
                    <Link key={x} to={`/lore/${x}`} className="pill is-oxblood" style={{ textDecoration: "none" }}>
                      {prettyId(x)}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
