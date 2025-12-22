import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";
import { apiGet } from "../api";

export default function ArchetypeResults() {
  const nav = useNavigate();

  const [result, setResult] = useState(null);      // localStorage payload
  const [arch, setArch] = useState(null);          // fetched archetype doc
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Load last result
  useEffect(() => {
    try {
      const raw = localStorage.getItem("lastArchetypeResult_v2");
      if (!raw) {
        setResult(null);
        return;
      }
      setResult(JSON.parse(raw));
    } catch {
      setResult(null);
    }
  }, []);

  // Fetch archetype details
  useEffect(() => {
    if (!result?.archetypeId) return;

    let alive = true;
    setLoading(true);
    setErr("");

    apiGet(`/api/archetypes/${result.archetypeId}`)
      .then((data) => {
        if (!alive) return;
        setArch(data);
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e?.message || "Failed to load archetype details");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [result?.archetypeId]);

  function retake() {
    nav("/archetype-test");
  }

  if (!result) {
    return (
      <div className="page">
        <div className="container">
          <div className="card">
            <h1 style={{ marginTop: 0 }}>Archetype Results</h1>
            <div className="small muted">No saved result found.</div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btnPrimary" onClick={retake}>
                Take the Test
              </button>
              <Link className="btn btnGhost" to="/dashboard">
                Dashboard
              </Link>
              <Link className="btn btnGhost" to="/lore">
                Lore Library
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const archetypeId = result.archetypeId;
  const name = arch?.name || result.archetypeName || archetypeId;
  const sphereName = arch?.sphere?.name || result.sphereId || "—";
  const familyName = arch?.family?.name || result.familyId || "—";
  const oneLine = arch?.oneLine || "";
  const matchScore = typeof result.matchScore === "number" ? result.matchScore : null;

  return (
    <div className="page">
      <div className="container">
        <div className="card">
          <h1 style={{ marginTop: 0 }}>Your Archetype</h1>

          <div className="card" style={{ boxShadow: "none" }}>
            <div style={{ fontWeight: 900, fontSize: 22 }}>{name}</div>
            <div className="small muted">
              {archetypeId} {arch?.code ? `• ${arch.code}` : ""}
            </div>
            <div className="small muted">
              {sphereName} • {familyName}
            </div>

            {oneLine ? <div style={{ marginTop: 10 }}>{oneLine}</div> : null}

            {matchScore !== null ? (
              <div className="small muted" style={{ marginTop: 10 }}>
                Match score: {matchScore}
              </div>
            ) : null}

            {loading ? <div className="small">Loading profile…</div> : null}
            {err ? (
              <div className="card" style={{ borderColor: "crimson", marginTop: 10 }}>
                <b>Couldn’t load full details.</b>
                <div className="small">{err}</div>
              </div>
            ) : null}

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="btn btnPrimary" to={`/lore/${archetypeId}`}>
                View Full Profile
              </Link>
              <button className="btn" onClick={retake}>
                Retake Test
              </button>
              <Link className="btn btnGhost" to="/lore">
                Browse Lore Library
              </Link>
              <Link className="btn btnGhost" to="/dashboard">
                Dashboard
              </Link>
            </div>
          </div>

          <hr className="hr" />

          <div className="small muted">
            Next upgrade: we’ll replace the “generic scale mapping” with per-question dimension mapping so the match is razor sharp.
          </div>
        </div>
      </div>
    </div>
  );
}
