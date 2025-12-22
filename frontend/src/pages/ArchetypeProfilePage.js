import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../App.css";
import { apiGet } from "../api";

export default function ArchetypeProfilePage() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");

    apiGet(`/api/archetypes/${id}`)
      .then((data) => { if (alive) setDoc(data); })
      .catch((e) => { if (alive) setErr(e?.message || "Failed to load profile"); })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [id]);

  return (
    <div className="page">
      <div className="container">
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ marginTop: 0 }}>{doc?.name || id}</h1>
              <div className="small muted">
                {doc?.code ? `${doc.code} • ` : ""}{doc?.id || id}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Link className="btn btnGhost" to="/archetype">Back</Link>
              <Link className="btn btnPrimary" to={`/lore/${id}`}>Open Lore Page</Link>
            </div>
          </div>

          <hr className="hr" />

          {loading ? <p className="small">Loading…</p> : null}
          {err ? (
            <div className="card" style={{ borderColor: "crimson" }}>
              <b>Couldn’t load profile.</b>
              <div className="small">{err}</div>
            </div>
          ) : null}

          {doc ? (
            <div style={{ display: "grid", gap: 12 }}>
              <div className="card" style={{ boxShadow: "none" }}>
                <b>Sphere / Family</b>
                <div className="small muted">
                  {(doc?.sphere?.name || doc?.sphere?.id || "")}
                  {" • "}
                  {(doc?.family?.name || doc?.family?.id || "")}
                </div>
              </div>

              <div className="card" style={{ boxShadow: "none" }}>
                <b>One Line</b>
                <div className="small">{doc.oneLine || "—"}</div>
              </div>

              <div className="card" style={{ boxShadow: "none" }}>
                <b>Lore</b>
                <div className="small">
                  {doc?.page?.lore?.paragraph || "No lore yet."}
                </div>
              </div>

              <div className="card" style={{ boxShadow: "none" }}>
                <b>Psychology</b>
                <pre className="small" style={{ whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(doc?.page?.psychology || {}, null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
