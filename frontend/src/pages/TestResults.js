// frontend/src/pages/TestResults.js
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

function safeObj(x) {
  return x && typeof x === "object" ? x : {};
}
function safeArr(x) {
  return Array.isArray(x) ? x : [];
}
function safeStr(x) {
  return String(x ?? "").trim();
}
function readProfileKey(search) {
  const sp = new URLSearchParams(search || "");
  return safeStr(sp.get("profileKey")) || "debug_profile";
}
function topPairs(mapObj, topN = 12) {
  const m = safeObj(mapObj);
  return Object.entries(m)
    .map(([k, v]) => ({ k, v: Number(v || 0) }))
    .filter((x) => Number.isFinite(x.v))
    .sort((a, b) => b.v - a.v)
    .slice(0, topN);
}
function pretty(x) {
  try {
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}

export default function TestResults() {
  const { attemptId } = useParams(); // not required for assemble, but route includes it
  const location = useLocation();
  const profileKey = useMemo(() => readProfileKey(location.search), [location.search]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  async function loadAssembled() {
    setLoading(true);
    setErr("");
    try {
      const url = `/api/results/assemble?profileKey=${encodeURIComponent(profileKey)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.message || "Failed to assemble results");
      setData(json);
    } catch (e) {
      setErr(e?.message || "Failed to load results");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssembled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileKey]);

  const finalResult = data?.finalResult || null;

  const selections = safeObj(finalResult?.selections);
  const primary = safeObj(selections?.primary);

  const topArchetype =
    primary?.archetype ||
    safeArr(selections?.topArchetypes)?.[0]?.tag ||
    safeArr(selections?.topArchetypes)?.[0]?.id ||
    "";

  const topLuminary =
    primary?.luminary ||
    safeArr(selections?.topLuminaries)?.[0]?.tag ||
    safeArr(selections?.topLuminaries)?.[0]?.id ||
    "";

  const topShadow =
    primary?.shadow ||
    safeArr(selections?.topShadows)?.[0]?.tag ||
    safeArr(selections?.topShadows)?.[0]?.id ||
    "";

  const totals = safeObj(finalResult?.totals);
  const majorTotals = safeObj(totals?.major);
  const luminaryTotals = safeObj(totals?.luminary);
  const shadowTotals = safeObj(totals?.shadow);

  const magic = safeObj(finalResult?.magic);

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Results</h1>
          <div className="muted">
            ProfileKey: <code>{profileKey}</code>{" "}
            {attemptId ? (
              <>
                • Attempt: <code>{attemptId}</code>
              </>
            ) : null}
          </div>
        </div>

        <div className="headerActions">
          <Link className="btn btnGhost" to={`/tests?profileKey=${encodeURIComponent(profileKey)}`}>
            Back to Tests
          </Link>
          <Link className="btn btnGhost" to={`/dashboard?profileKey=${encodeURIComponent(profileKey)}`}>
            Dashboard
          </Link>
          <button className="btn" onClick={loadAssembled} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {err ? <div className="card error">{err}</div> : null}
      {loading ? <div className="card">Assembling latest results…</div> : null}

      {!loading && !err && !finalResult ? (
        <div className="card">
          <div className="cardTitle">No final result yet</div>
          <div className="muted small">
            Submit at least one test (major / mini / daily) then refresh.
          </div>
        </div>
      ) : null}

      {!loading && !err && finalResult ? (
        <>
          <div className="grid2">
            <div className="card">
              <div className="cardTitle">Primary Selection</div>
              <div className="muted small">Your current top trio from assembled totals.</div>

              <div className="kv" style={{ marginTop: 10 }}>
                <div className="k">Archetype</div>
                <div className="v">{topArchetype || <span className="muted">—</span>}</div>

                <div className="k">Luminary</div>
                <div className="v">{topLuminary || <span className="muted">—</span>}</div>

                <div className="k">Shadow</div>
                <div className="v">{topShadow || <span className="muted">—</span>}</div>

                <div className="k">Version</div>
                <div className="v">
                  <span className="muted">{finalResult?.version || "—"}</span>
                </div>
              </div>

              {data?.sources ? (
                <div style={{ marginTop: 12 }} className="muted small">
                  Sources:{" "}
                  <code>{data?.sources?.major?.attemptId || "no major yet"}</code>{" "}
                  • minis: <code>{safeArr(data?.sources?.miniUsed).length}</code>
                </div>
              ) : null}
            </div>

            <div className="card">
              <div className="cardTitle">Magic Snapshot</div>
              <div className="muted small">
                Shows assigned world/school/packs if your assembler includes magic.
              </div>

              <div style={{ marginTop: 10 }} className="magicGrid">
                <MagicMiniCard title="Archetype Magic" data={magic?.archetype} />
                <MagicMiniCard title="Luminary Magic" data={magic?.luminary} />
                <MagicMiniCard title="Shadow Magic" data={magic?.shadow} />
              </div>

              <div className="row" style={{ marginTop: 12 }}>
                <Link className="btn btnGhost" to="/magic">
                  Open Magic Library
                </Link>
              </div>
            </div>
          </div>

          <div className="grid3">
            <TotalsCard title="Major Totals" subtitle="Top tags from Major Test + daily assignments" map={majorTotals} />
            <TotalsCard title="Luminary Totals" subtitle="Summed across latest mini suite submissions" map={luminaryTotals} />
            <TotalsCard title="Shadow Totals" subtitle="Summed across latest mini suite submissions" map={shadowTotals} />
          </div>

          <div className="card">
            <div className="cardTitle">Raw Final Result (Debug)</div>
            <div className="muted small">If something looks off, copy/paste this into chat.</div>
            <textarea className="textarea" rows={18} value={pretty(finalResult)} readOnly />
          </div>
        </>
      ) : null}
    </div>
  );
}

function TotalsCard({ title, subtitle, map }) {
  const list = topPairs(map, 12);
  return (
    <div className="card">
      <div className="cardTitle">{title}</div>
      <div className="muted small">{subtitle}</div>

      <div style={{ marginTop: 10 }}>
        {list.length === 0 ? (
          <div className="muted">—</div>
        ) : (
          <div className="totalsList">
            {list.map((x) => (
              <div className="totalsRow" key={x.k}>
                <div className="totalsKey">{x.k}</div>
                <div className="totalsVal">{x.v}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MagicMiniCard({ title, data }) {
  const d = safeObj(data);
  const worldName = d?.world?.name || d?.worldId || "—";
  const packNames = safeArr(d?.packs).map((p) => p?.name || p?.packId).filter(Boolean);
  const abilityCount = safeArr(d?.abilities).length;

  return (
    <div className="miniCard">
      <div className="miniTitle">{title}</div>
      <div className="miniLine">
        <span className="muted">World:</span> {worldName}
      </div>
      <div className="miniLine">
        <span className="muted">School:</span> {d?.school || "—"}
      </div>
      <div className="miniLine">
        <span className="muted">Packs:</span> {packNames.length ? packNames.join(" • ") : "—"}
      </div>
      <div className="miniLine">
        <span className="muted">Abilities:</span> {abilityCount}
      </div>
    </div>
  );
}
