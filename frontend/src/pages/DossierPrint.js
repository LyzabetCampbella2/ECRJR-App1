// src/pages/DossierPrint.js
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet } from "../apiClient";

function safeText(x) {
  if (x == null) return "";
  if (typeof x === "string") return x;
  try { return JSON.stringify(x); } catch { return String(x); }
}

export default function DossierPrint() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setError("");
        const res = await apiGet(`/api/lore/lumi-shadow/${id}`);
        if (!alive) return;
        setItem(res.item || null);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Failed to load dossier.");
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (error) {
    return (
      <div className="card">
        <div className="card-title">Dossier</div>
        <p style={{ color: "crimson" }}>{error}</p>
        <Link className="btn" to="/lore">Back</Link>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="card">
        <div className="card-title">Loading dossier…</div>
        <p className="card-meta">{safeText(id)}</p>
      </div>
    );
  }

  return (
    <div className="card dossier">
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
        <Link className="btn" to={`/lore/${item.id}`}>Back to Lore</Link>
        <Link className="btn" to="/lore">Lore Index</Link>
      </div>

      <div className="hr" />

      <h1 style={{ margin: "0 0 6px" }}>{item.name}</h1>
      <div className="card-meta">{item.kind?.toUpperCase()} • {item.id}</div>
      {item.essence && <p style={{ marginTop: 10 }}><b>Essence:</b> {safeText(item.essence)}</p>}
      {item.mantra && <p style={{ marginTop: 6 }}><b>Mantra:</b> “{safeText(item.mantra)}”</p>}

      <h2 style={{ marginTop: 16 }}>Lore</h2>
      {(item.lore || []).map((p, i) => <p key={i}>{safeText(p)}</p>)}

      <h2>Psychology</h2>
      <ul>
        <li><b>Core drive:</b> {safeText(item.psychology?.coreDrive)}</li>
        <li><b>Core fear:</b> {safeText(item.psychology?.coreFear)}</li>
        <li><b>Protective function:</b> {safeText(item.psychology?.protectiveFunction)}</li>
        <li><b>Attachment:</b> {safeText(item.psychology?.attachmentPattern)}</li>
        <li><b>Nervous system:</b> {safeText(item.psychology?.nervousSystemBias)}</li>
      </ul>

      <h2>Sociology</h2>
      <ul>
        <li><b>Roles:</b> {(item.sociology?.roles || []).map(safeText).join(", ")}</li>
        <li><b>Modern manifestations:</b> {(item.sociology?.modernManifestations || []).map(safeText).join(", ")}</li>
        <li><b>Reward:</b> {safeText(item.sociology?.socialReward)}</li>
        <li><b>Cost:</b> {safeText(item.sociology?.socialCost)}</li>
      </ul>

      <h2>Anthropology</h2>
      <ul>
        <li><b>Historical echoes:</b> {(item.anthropology?.historicalEchoes || []).map(safeText).join(", ")}</li>
        <li><b>Mythic parallels:</b> {(item.anthropology?.mythicParallels || []).map(safeText).join(", ")}</li>
        <li><b>Variants:</b> {(item.anthropology?.culturalVariants || []).map(safeText).join(", ")}</li>
      </ul>

      <h2>Pedagogy</h2>
      <p><b>Teaches:</b> {safeText(item.pedagogy?.teaches)}</p>
      <p><b>Learns best through:</b> {(item.pedagogy?.learnsBestThrough || []).map(safeText).join(", ")}</p>
      <p><b>Integration practices:</b></p>
      <ul>
        {(item.pedagogy?.integrationPractices || []).map((p, i) => <li key={i}>{safeText(p)}</li>)}
      </ul>

      <h2>Development</h2>
      <ul>
        <li><b>Early:</b> {safeText(item.development?.earlyExpression)}</li>
        <li><b>Mature:</b> {safeText(item.development?.matureExpression)}</li>
        <li><b>Integrated:</b> {safeText(item.development?.integratedExpression)}</li>
      </ul>
    </div>
  );
}
