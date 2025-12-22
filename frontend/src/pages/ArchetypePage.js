// src/pages/ArchetypePage.js
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const DATA_BASE = `${process.env.PUBLIC_URL || ""}/data`;

function safeIncludes(hay, needle) {
  if (!needle) return true;
  return String(hay || "").toLowerCase().includes(String(needle).toLowerCase());
}

export default function ArchetypePage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);

  // UI
  const [q, setQ] = useState("");
  const [constellation, setConstellation] = useState("all");
  const [sortMode, setSortMode] = useState("name"); // name | id | constellation
  const [page, setPage] = useState(1);
  const pageSize = 48;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr("");

      try {
        const res = await fetch(`${DATA_BASE}/all900archetypes.json`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load all900archetypes.json (${res.status})`);
        const data = await res.json();
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load archetypes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const constellations = useMemo(() => {
    const set = new Set();
    for (const a of items) {
      if (a?.constellation) set.add(a.constellation);
    }
    return ["all", ...Array.from(set).sort((a, b) => String(a).localeCompare(String(b)))];
  }, [items]);

  const filtered = useMemo(() => {
    const out = items.filter((a) => {
      if (!a) return false;

      const constOk = constellation === "all" ? true : a.constellation === constellation;

      const text = [
        a.name,
        a.id,
        a.tag,
        a.subtitle,
        a.constellation,
        ...(Array.isArray(a.luminaryTags) ? a.luminaryTags : []),
        ...(Array.isArray(a.shadowTags) ? a.shadowTags : []),
      ]
        .filter(Boolean)
        .join(" • ");

      const qOk = q ? safeIncludes(text, q) : true;

      return constOk && qOk;
    });

    out.sort((a, b) => {
      const ax =
        sortMode === "id"
          ? a.id
          : sortMode === "constellation"
          ? a.constellation
          : a.name;
      const bx =
        sortMode === "id"
          ? b.id
          : sortMode === "constellation"
          ? b.constellation
          : b.name;

      return String(ax || "").localeCompare(String(bx || ""), undefined, { sensitivity: "base" });
    });

    return out;
  }, [items, q, constellation, sortMode]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    if (page > pageCount) setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCount]);

  const visible = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  function openProfile(a) {
    if (!a?.id) return;
    navigate(`/lore/archetype/${a.id}`);
  }

  return (
    <div className="page">
      <div className="pageHeader">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 className="pageTitle">Archetypes</h1>
            <p className="pageSubtitle">Browse all 900 archetypes and open their profiles.</p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Link className="btn" to="/dashboard">
              Continue → Dashboard
            </Link>
            <Link className="btn" to="/lore">
              Open Lore Library
            </Link>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="toolbarLeft">
            <input
              className="input"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search archetype name, tag, constellation, linked tags…"
            />

            <select
              className="select"
              value={constellation}
              onChange={(e) => {
                setConstellation(e.target.value);
                setPage(1);
              }}
              title="Filter by constellation"
            >
              {constellations.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All Constellations" : c}
                </option>
              ))}
            </select>

            <select className="select" value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
              <option value="name">Sort: Name</option>
              <option value="id">Sort: ID</option>
              <option value="constellation">Sort: Constellation</option>
            </select>
          </div>

          <div className="toolbarRight">
            <div className="muted">
              Showing <strong>{filtered.length}</strong> / {items.length}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="muted" style={{ padding: 16 }}>
            Loading archetypes…
          </div>
        ) : err ? (
          <div className="errorBox" style={{ padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Could not load archetypes</div>
            <div className="muted">{err}</div>
            <div className="muted" style={{ marginTop: 10 }}>
              Ensure <code>public/data/all900archetypes.json</code> exists.
            </div>
          </div>
        ) : (
          <>
            <div className="muted" style={{ padding: "6px 14px 0" }}>
              Page <strong>{page}</strong> / <strong>{pageCount}</strong>
            </div>

            <div className="grid" style={{ paddingTop: 10 }}>
              {visible.map((a) => (
                <div key={a.id} className="loreCard" style={{ cursor: "default" }}>
                  <div className="loreCardTop">
                    <span className="badge badge-archetype">archetype</span>
                    <span className="badge badge-constellation">{a.constellation || "—"}</span>
                  </div>

                  <div className="loreCardTitle">{a.name || a.id}</div>

                  <div className="loreCardMeta">
                    <span className="mono">{a.id}</span> · <span className="mono">{a.tag}</span>
                  </div>

                  {a.subtitle ? <div className="loreCardSubtitle">{a.subtitle}</div> : null}

                  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button className="btn" onClick={() => openProfile(a)}>
                      Profile
                    </button>
                    <button className="btn" onClick={() => navigate(`/lore/archetype/${a.id}`)}>
                      Open Lore →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pager">
              <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                ← Prev
              </button>

              <div className="muted">
                Page {page} of {pageCount}
              </div>

              <button className="btn" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
