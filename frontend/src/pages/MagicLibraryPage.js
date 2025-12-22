// frontend/src/pages/MagicLibraryPage.js
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

function safeArr(x) {
  return Array.isArray(x) ? x : [];
}

function safeStr(x) {
  return String(x ?? "").trim();
}

function contains(hay, needle) {
  const h = safeStr(hay).toLowerCase();
  const n = safeStr(needle).toLowerCase();
  if (!n) return true;
  return h.includes(n);
}

function prettyJson(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export default function MagicLibraryPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [worlds, setWorlds] = useState([]);
  const [packs, setPacks] = useState([]);
  const [meta, setMeta] = useState(null);

  const [tab, setTab] = useState("worlds"); // "worlds" | "packs" | "expand"
  const [q, setQ] = useState("");
  const [selectedPackId, setSelectedPackId] = useState("");
  const [expandedWorldId, setExpandedWorldId] = useState(null);
  const [expandedPackId, setExpandedPackId] = useState(null);

  // Expand tester
  const [expandInput, setExpandInput] = useState(
    prettyJson({
      worldId: "world_06_noxmere",
      school: "Illusionweave",
      aspects: ["Smoke", "Mirror"],
      packIds: ["pack_trickster_01"],
      uniqueAbilities: [],
    })
  );
  const [expandOutput, setExpandOutput] = useState("");
  const [expandBusy, setExpandBusy] = useState(false);

  async function loadLibrary() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/magic/library?includeAbilities=true");
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.message || "Failed to load magic library");
      setWorlds(safeArr(data.worlds));
      setPacks(safeArr(data.packs));
      setMeta(data.meta || null);
    } catch (e) {
      setErr(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLibrary();
  }, []);

  const worldsFiltered = useMemo(() => {
    if (!q) return worlds;
    return worlds.filter((w) => {
      const blob =
        `${w.name} ${w.subtitle} ${(w.tone || []).join(" ")} ${(w.magicLaws || []).join(" ")} ${(w.factions || []).join(" ")} ${(w.biomes || []).join(" ")}`;
      return contains(blob, q);
    });
  }, [worlds, q]);

  const packsFiltered = useMemo(() => {
    const list = packs;

    return list
      .filter((p) => {
        if (!q && !selectedPackId) return true;

        if (selectedPackId && p.packId !== selectedPackId) return false;

        const abilityNames = safeArr(p.abilities).map((a) => a?.name).join(" ");
        const blob = `${p.packId} ${p.name} ${(p.tags || []).join(" ")} ${abilityNames}`;
        return contains(blob, q);
      })
      .sort((a, b) => safeStr(a.name).localeCompare(safeStr(b.name)));
  }, [packs, q, selectedPackId]);

  const packOptions = useMemo(() => {
    return packs
      .slice()
      .sort((a, b) => safeStr(a.name).localeCompare(safeStr(b.name)))
      .map((p) => ({ packId: p.packId, name: p.name }));
  }, [packs]);

  async function doExpand() {
    setExpandBusy(true);
    setExpandOutput("");
    try {
      const magic = JSON.parse(expandInput);

      const res = await fetch("/api/magic/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ magic }),
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.message || "Expand failed");

      setExpandOutput(prettyJson(data.expanded));
    } catch (e) {
      setExpandOutput(`ERROR: ${e?.message || "Bad JSON or server error"}`);
    } finally {
      setExpandBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Magic Library</h1>
          <div className="muted">
            Browse worlds, ability packs, and test-expand a magic profile.
          </div>
        </div>

        <div className="headerActions">
          <Link className="btn btnGhost" to="/dashboard">
            Back to Dashboard
          </Link>
          <button className="btn" onClick={loadLibrary} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${tab === "worlds" ? "active" : ""}`}
          onClick={() => setTab("worlds")}
        >
          Worlds
        </button>
        <button
          className={`tab ${tab === "packs" ? "active" : ""}`}
          onClick={() => setTab("packs")}
        >
          Ability Packs
        </button>
        <button
          className={`tab ${tab === "expand" ? "active" : ""}`}
          onClick={() => setTab("expand")}
        >
          Test Expand
        </button>
      </div>

      <div className="controls">
        <input
          className="input"
          placeholder="Search worlds/packs/abilities..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {tab === "packs" && (
          <select
            className="select"
            value={selectedPackId}
            onChange={(e) => setSelectedPackId(e.target.value)}
          >
            <option value="">All packs</option>
            {packOptions.map((p) => (
              <option key={p.packId} value={p.packId}>
                {p.name} ({p.packId})
              </option>
            ))}
          </select>
        )}

        {meta?.loadedAt && (
          <div className="muted small">
            Loaded: {meta.loadedAt} • Worlds: {worlds.length} • Packs: {packs.length}
          </div>
        )}
      </div>

      {loading && <div className="card">Loading magic library…</div>}
      {!loading && err && <div className="card error">{err}</div>}

      {!loading && !err && tab === "worlds" && (
        <div className="grid">
          {worldsFiltered.map((w) => {
            const open = expandedWorldId === w.worldId;
            return (
              <div className="card" key={w.worldId}>
                <div className="cardHeader">
                  <div>
                    <div className="kicker">{w.worldId}</div>
                    <div className="cardTitle">{w.name}</div>
                    <div className="muted">{w.subtitle}</div>
                  </div>
                  <button
                    className="btn btnGhost"
                    onClick={() => setExpandedWorldId(open ? null : w.worldId)}
                  >
                    {open ? "Hide" : "View"}
                  </button>
                </div>

                <div className="pillRow">
                  {safeArr(w.tone).slice(0, 6).map((t) => (
                    <span className="pill" key={t}>
                      {t}
                    </span>
                  ))}
                </div>

                {open && (
                  <div className="cardBody">
                    <Section title="Magic Laws" items={w.magicLaws} />
                    <Section title="Costs" items={w.costs} />
                    <Section title="Factions" items={w.factions} />
                    <Section title="Biomes" items={w.biomes} />
                  </div>
                )}
              </div>
            );
          })}
          {worldsFiltered.length === 0 && (
            <div className="card muted">No worlds match your search.</div>
          )}
        </div>
      )}

      {!loading && !err && tab === "packs" && (
        <div className="grid">
          {packsFiltered.map((p) => {
            const open = expandedPackId === p.packId;
            const abilities = safeArr(p.abilities);

            return (
              <div className="card" key={p.packId}>
                <div className="cardHeader">
                  <div>
                    <div className="kicker">{p.packId}</div>
                    <div className="cardTitle">{p.name}</div>
                    <div className="muted">
                      {safeArr(p.tags).join(" • ")}{" "}
                      {abilities.length ? `• ${abilities.length} abilities` : ""}
                    </div>
                  </div>
                  <button
                    className="btn btnGhost"
                    onClick={() => setExpandedPackId(open ? null : p.packId)}
                  >
                    {open ? "Hide" : "View"}
                  </button>
                </div>

                <div className="pillRow">
                  {safeArr(p.tags).slice(0, 6).map((t) => (
                    <span className="pill" key={t}>
                      {t}
                    </span>
                  ))}
                </div>

                {open && (
                  <div className="cardBody">
                    {abilities.length === 0 && (
                      <div className="muted">No abilities found in this pack.</div>
                    )}

                    {abilities.map((a) => (
                      <div className="ability" key={a.id || a.name}>
                        <div className="abilityTop">
                          <div className="abilityName">
                            {a.name}{" "}
                            <span className="muted small">
                              ({a.type || "active"})
                            </span>
                          </div>
                          <div className="abilityMeta muted small">
                            Cost: {a.cost || "none"} • Cooldown: {a.cooldown ?? 0}
                          </div>
                        </div>

                        {a.effect && <div className="abilityText">{a.effect}</div>}
                        {a.counter && (
                          <div className="abilityCounter muted small">
                            Counter: {a.counter}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {packsFiltered.length === 0 && (
            <div className="card muted">No packs match your search.</div>
          )}
        </div>
      )}

      {!loading && !err && tab === "expand" && (
        <div className="split">
          <div className="card">
            <div className="cardTitle">Magic Profile Input</div>
            <div className="muted small">
              Paste a magic profile (JSON). We’ll call <code>/api/magic/expand</code>.
            </div>

            <textarea
              className="textarea"
              value={expandInput}
              onChange={(e) => setExpandInput(e.target.value)}
              rows={18}
            />

            <div className="row">
              <button className="btn" onClick={doExpand} disabled={expandBusy}>
                {expandBusy ? "Expanding…" : "Expand"}
              </button>
              <button
                className="btn btnGhost"
                onClick={() => setExpandInput(prettyJson({
                  worldId: "world_01_elyndra",
                  school: "Sigilcraft",
                  aspects: ["Star", "Veil"],
                  packIds: ["pack_mystic_01"],
                  uniqueAbilities: []
                }))}
              >
                Reset Example
              </button>
            </div>
          </div>

          <div className="card">
            <div className="cardTitle">Expanded Output</div>
            <div className="muted small">World + packs + abilities will appear here.</div>
            <textarea className="textarea" value={expandOutput} readOnly rows={18} />
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, items }) {
  const list = safeArr(items).filter(Boolean);
  if (list.length === 0) return null;

  return (
    <div className="section">
      <div className="sectionTitle">{title}</div>
      <ul className="list">
        {list.map((x, idx) => (
          <li key={`${title}-${idx}`}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
