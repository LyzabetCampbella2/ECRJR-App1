import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import catalog from "../data/archetypesCatalog.json";

const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));

function textBlob(entry) {
  const lore = entry?.lore || {};
  const bits = [
    entry?.id,
    entry?.name,
    entry?.family,
    entry?.tier,
    ...(entry?.tags || []),
    lore?.oneLiner,
    lore?.overview,
    ...(lore?.gifts || []),
    ...(lore?.risks || []),
    lore?.healerPath,
    lore?.alchemyNotes,
    ...(lore?.prompts || []),
  ];
  return bits.filter(Boolean).join(" ").toLowerCase();
}

function chipList(label, ids = []) {
  if (!ids?.length) return null;
  return (
    <div className="chipRow">
      <span className="chipLabel">{label}</span>
      <div className="chips">
        {ids.map((id) => (
          <Link key={id} className="chip" to={`/archetypes/${id}`}>
            {id}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ArchetypeIndex() {
  const all = Array.isArray(catalog) ? catalog : (catalog?.entries || []);
  const families = useMemo(() => uniq(all.map((a) => a.family)).sort(), [all]);
  const tiers = useMemo(() => uniq(all.map((a) => a.tier)).sort(), [all]);

  const allTags = useMemo(() => {
    const tags = [];
    for (const a of all) for (const t of (a.tags || [])) tags.push(t);
    return uniq(tags).sort((a, b) => a.localeCompare(b));
  }, [all]);

  const [q, setQ] = useState("");
  const [family, setFamily] = useState("All");
  const [tier, setTier] = useState("All");
  const [tag, setTag] = useState("All");
  const [sort, setSort] = useState("name_asc");
  const [showLinks, setShowLinks] = useState(true);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    let items = all;

    if (family !== "All") items = items.filter((a) => a.family === family);
    if (tier !== "All") items = items.filter((a) => a.tier === tier);
    if (tag !== "All") items = items.filter((a) => (a.tags || []).includes(tag));

    if (query) items = items.filter((a) => textBlob(a).includes(query));

    const cmp = {
      name_asc: (a, b) => (a.name || "").localeCompare(b.name || ""),
      name_desc: (a, b) => (b.name || "").localeCompare(a.name || ""),
      id_asc: (a, b) => (a.id || "").localeCompare(b.id || ""),
      family_asc: (a, b) => (a.family || "").localeCompare(b.family || ""),
      updated_desc: (a, b) =>
        new Date(b?.meta?.updatedAt || 0).getTime() - new Date(a?.meta?.updatedAt || 0).getTime(),
    }[sort];

    if (cmp) items = [...items].sort(cmp);
    return items;
  }, [all, q, family, tier, tag, sort]);

  return (
    <div className="archIndexPage">
      <header className="archHeader">
        <div>
          <h1>Archetype Index</h1>
          <p className="archSub">
            Search, filter, and jump through opposites/allies/evolutions. ({results.length} shown)
          </p>
        </div>
        <div className="archHeaderRight">
          <label className="toggle">
            <input
              type="checkbox"
              checked={showLinks}
              onChange={(e) => setShowLinks(e.target.checked)}
            />
            <span>Show cross-links</span>
          </label>
        </div>
      </header>

      <section className="archControls">
        <input
          className="archSearch"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search: name, tags, family, lore text…"
        />

        <div className="archFilters">
          <select value={family} onChange={(e) => setFamily(e.target.value)}>
            <option value="All">All Families</option>
            {families.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>

          <select value={tier} onChange={(e) => setTier(e.target.value)}>
            <option value="All">All Tiers</option>
            {tiers.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="All">All Tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="name_asc">Sort: Name A→Z</option>
            <option value="name_desc">Sort: Name Z→A</option>
            <option value="id_asc">Sort: ID</option>
            <option value="family_asc">Sort: Family</option>
            <option value="updated_desc">Sort: Recently Updated</option>
          </select>

          <button
            className="archReset"
            onClick={() => {
              setQ("");
              setFamily("All");
              setTier("All");
              setTag("All");
              setSort("name_asc");
            }}
          >
            Reset
          </button>
        </div>
      </section>

      <section className="archGrid">
        {results.map((a) => {
          const links = a.links || {};
          return (
            <article key={a.id} className="archCard">
              <div className="archCardTop">
                <div className="archTitle">
                  <Link to={`/archetypes/${a.id}`} className="archName">
                    {a.name || a.id}
                  </Link>
                  <div className="archMeta">
                    <span className="pill">{a.id}</span>
                    {a.family && <span className="pill">{a.family}</span>}
                    {a.tier && <span className="pill">{a.tier}</span>}
                  </div>
                </div>
              </div>

              {a?.lore?.oneLiner && <p className="archOneLiner">{a.lore.oneLiner}</p>}

              {(a.tags || []).length > 0 && (
                <div className="tagRow">
                  {(a.tags || []).slice(0, 8).map((t) => (
                    <button
                      key={t}
                      className="tag"
                      onClick={() => setTag(t)}
                      title="Click to filter by this tag"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {showLinks && (
                <div className="archLinks">
                  {chipList("Opposites", links?.opposites)}
                  {chipList("Allies", links?.allies)}
                  {chipList("Evolves From", links?.evolutions?.from)}
                  {chipList("Evolves To", links?.evolutions?.to)}
                </div>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
