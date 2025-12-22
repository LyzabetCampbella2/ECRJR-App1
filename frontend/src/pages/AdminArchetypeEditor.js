import React, { useEffect, useMemo, useState } from "react";
import "../App.css";
import { apiGet } from "../api";
import { Link } from "react-router-dom";

export default function AdminArchetypeEditor() {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem("eirden_admin_key") || "");
  const [search, setSearch] = useState("");
  const [list, setList] = useState([]);
  const [pickId, setPickId] = useState("");
  const [doc, setDoc] = useState(null);

  const [pageJSON, setPageJSON] = useState("");
  const [status, setStatus] = useState("");
  const [err, setErr] = useState("");

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("limit", "100");
    if (search.trim()) p.set("search", search.trim());
    return p.toString();
  }, [search]);

  useEffect(() => {
    let alive = true;
    setErr("");

    apiGet(`/api/archetypes?${qs}`)
      .then((data) => {
        if (!alive) return;
        setList(data?.items || []);
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e?.message || "Failed to load list");
      });

    return () => (alive = false);
  }, [qs]);

  useEffect(() => {
    if (!pickId) return;
    let alive = true;
    setStatus("Loading…");
    setErr("");

    apiGet(`/api/archetypes/${pickId}`)
      .then((a) => {
        if (!alive) return;
        setDoc(a);
        setPageJSON(JSON.stringify(a.page || {}, null, 2));
        setStatus("");
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e?.message || "Failed to load archetype");
        setStatus("");
      });

    return () => (alive = false);
  }, [pickId]);

  function saveKey() {
    localStorage.setItem("eirden_admin_key", adminKey);
  }

  async function save() {
    if (!doc?.id) return;
    setErr("");
    setStatus("Saving…");

    try {
      const page = JSON.parse(pageJSON);

      const res = await fetch(`/api/archetypes/${doc.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey
        },
        body: JSON.stringify({ page })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.message || "Save failed");

      setDoc(data.item);
      setStatus("Saved ✅");
      setTimeout(() => setStatus(""), 1200);
    } catch (e) {
      setStatus("");
      setErr(e?.message || "Save failed");
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="card">
          <h1 style={{ marginTop: 0 }}>Admin: Archetype Editor</h1>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn btnGhost" to="/dashboard">Dashboard</Link>
            <Link className="btn btnGhost" to="/lore">Lore Library</Link>
            <Link className="btn btnGhost" to="/constellation/archetypes">Constellation</Link>
          </div>

          <hr className="hr" />

          <div className="card" style={{ boxShadow: "none" }}>
            <div style={{ fontWeight: 800 }}>Admin Key</div>
            <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
              <input
                style={{ flex: 1, minWidth: 260 }}
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="ADMIN_KEY from backend/.env"
              />
              <button className="btn" onClick={saveKey}>Save Key</button>
            </div>
            <div className="small muted" style={{ marginTop: 8 }}>
              Sent as <code>x-admin-key</code> header to enable editing.
            </div>
          </div>

          <div className="card" style={{ boxShadow: "none" }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                style={{ flex: 1, minWidth: 240 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search archetypes…"
              />
              <select value={pickId} onChange={(e) => setPickId(e.target.value)}>
                <option value="">Select archetype…</option>
                {list.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {status ? <div className="small">{status}</div> : null}
          {err ? (
            <div className="card" style={{ borderColor: "crimson" }}>
              <b>Error</b>
              <div className="small">{err}</div>
            </div>
          ) : null}

          {doc ? (
            <>
              <div className="card" style={{ boxShadow: "none" }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>
                  {doc.name} <span className="small muted">({doc.id})</span>
                </div>
                <div className="small muted">
                  {doc?.sphere?.name} • {doc?.family?.name}
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link className="btn btnGhost" to={`/lore/${doc.id}`}>View</Link>
                  <button className="btn btnPrimary" onClick={save}>Save Page JSON</button>
                </div>
              </div>

              <div className="card" style={{ boxShadow: "none" }}>
                <div style={{ fontWeight: 800 }}>page (JSON)</div>
                <textarea
                  style={{ width: "100%", minHeight: 360, marginTop: 8 }}
                  value={pageJSON}
                  onChange={(e) => setPageJSON(e.target.value)}
                />
                <div className="small muted" style={{ marginTop: 8 }}>
                  Edit psychology/sociology/anthropology/pedagogy/biology/lore/integration etc here.
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
