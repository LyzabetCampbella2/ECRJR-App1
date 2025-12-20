// src/pages/LoreIndex.js
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../apiClient";

function prettyId(id) {
  return String(id || "")
    .replace(/^lumi_/i, "")
    .replace(/^shadow_/i, "")
    .replace(/_/g, " ")
    .trim();
}

function safeText(x) {
  if (x == null) return "";
  if (typeof x === "string") return x;
  try {
    return JSON.stringify(x);
  } catch {
    return String(x);
  }
}

function KindPill({ kind }) {
  const cls =
    kind === "luminary"
      ? "pill is-forest"
      : kind === "shadow"
      ? "pill is-oxblood"
      : "pill";
  const label = kind === "luminary" ? "LUMINARY" : kind === "shadow" ? "SHADOW" : "LORE";
  return <span className={cls}>{label}</span>;
}

export default function LoreIndex() {
  // Step 4: Lore Index should only list Luminaries + Shadows
  const [filter, setFilter] = useState("all"); // all | luminary | shadow
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // backend returns { items: { [id]: {...} } }
  const [itemsMap, setItemsMap] = useState({});

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        // IMPORTANT: keep archetypes out of /lore entirely
        if (filter === "luminary") params.set("kind", "luminary");
        if (filter === "shadow") params.set("kind", "shadow");
        if (q.trim()) params.set("q", q.trim());

        const url = `/api/lore/lumi-shadow${params.toString() ? `?${params.toString()}` : ""}`;

        const res = await apiGet(url);
        if (!alive) return;

        setItemsMap(res.items || {});
        setLoading(false);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Failed to load lore index.");
        setItemsMap({});
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [filter, q]);

  const list = useMemo(() => {
    const arr = Object.values(itemsMap || {});
    // Stable sort: kind then name/id
    return arr.sort((a, b) => {
      const ka = String(a.kind || "");
      const kb = String(b.kind || "");
      if (ka !== kb) return ka.localeCompare(kb);
      const na = String(a.name || a.id || "");
      const nb = String(b.name || b.id || "");
      return na.localeCompare(nb);
    });
  }, [itemsMap]);

  const counts = useMemo(() => {
    let lum = 0;
    let sha = 0;
    for (const it of list) {
      if (it?.kind === "luminary") lum++;
      else if (it?.kind === "shadow") sha++;
    }
    return { lum, sha, total: list.length };
  }, [list]);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Lore Index</div>
        <div className="card-meta">
          {loading ? "Loading…" : `${counts.total} • ${counts.lum} lum • ${counts.sha} shadow`}
        </div>
      </div>

      <p className="card-meta" style={{ marginTop: 6 }}>
        This page is for <b>Luminaries</b> + <b>Shadows</b> (mini-suite lore).
        Archetypes are on a separate page:{" "}
        <Link to="/archetypes" style={{ textDecoration: "underline" }}>
          /archetypes
        </Link>
        .
      </p>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ minWidth: 180 }}
        >
          <option value="all">All (Luminaries + Shadows)</option>
          <option value="luminary">Luminaries only</option>
          <option value="shadow">Shadows only</option>
        </select>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search lore…"
          style={{ flex: 1, minWidth: 220 }}
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn" to="/">
            Dashboard
          </Link>
          <Link className="btn" to="/archetypes">
            Archetypes
          </Link>
        </div>
      </div>

      <div className="hr" />

      {/* States */}
      {loading && <p className="card-meta">Gathering the archive…</p>}

      {!loading && error && (
        <div className="card" style={{ boxShadow: "none" }}>
          <div className="card-title">Couldn’t load lore</div>
          <p style={{ color: "crimson", marginTop: 10 }}>{safeText(error)}</p>
          <p className="card-meta" style={{ marginTop: 10 }}>
            Check backend: <code>/api/lore/lumi-shadow</code>
          </p>
        </div>
      )}

      {!loading && !error && list.length === 0 && (
        <p className="card-meta">
          No lore entries found. If you just seeded, refresh the page (and confirm Mongo is connected).
        </p>
      )}

      {/* Results grid */}
      {!loading && !error && list.length > 0 && (
        <div className="grid" style={{ marginTop: 10 }}>
          {list.map((it) => {
            const title = it?.name || prettyId(it?.id);
            const snippet = it?.shortLore || it?.essence || "";

            return (
              <div key={it.id} className="card" style={{ boxShadow: "none" }}>
                <div className="card-header">
                  <div
                    className="card-title"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <KindPill kind={it.kind} />
                    {safeText(title)}
                  </div>
                  <div className="card-meta">{safeText(it.id)}</div>
                </div>

                {snippet && (
                  <p className="card-meta" style={{ marginTop: 0 }}>
                    {safeText(snippet)}
                  </p>
                )}

                <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link className="btn btn-primary" to={`/lore/${it.id}`}>
                    Open Lore
                  </Link>
                  <Link className="btn" to={`/dossier/${it.id}`}>
                    Printable Dossier
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="hr" />

      {/* Footer helper */}
      <details>
        <summary className="card-meta" style={{ cursor: "pointer" }}>
          Developer notes
        </summary>
        <div style={{ marginTop: 10 }}>
          <p className="card-meta" style={{ marginTop: 0 }}>
            This index intentionally excludes archetypes. Use <code>/archetypes</code> for the main test.
          </p>
          <ul style={{ marginTop: 10 }}>
            <li>
              Backend endpoint: <code>GET /api/lore/lumi-shadow</code>
            </li>
            <li>
              Filters used: <code>?kind=luminary</code>, <code>?kind=shadow</code>, <code>&amp;q=search</code>
            </li>
          </ul>
        </div>
      </details>
    </div>
  );
}
