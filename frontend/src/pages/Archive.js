import { useEffect, useState } from "react";
import { apiGet } from "../apiClient";
import SiteShell from "../components/SiteShell";

export default function Archive() {
  const profileId = localStorage.getItem("eirden_profile");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    if (!profileId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiGet(`/api/results/${profileId}`);
      setItems(res.results || []);
    } catch (e) {
      setError(e.message || "Failed to load archive.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  function formatDate(d) {
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  }

  if (!profileId) {
    return (
      <SiteShell title="Archive" subtitle="Sealed runs preserved by Raveliquarith.">
        <div className="container">
          <div className="panel">
            <p>No profile loaded yet.</p>
            <a href="/dashboard">Go to Dashboard →</a>
          </div>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell
      title="Archive"
      subtitle="Sealed runs preserved by Raveliquarith."
      rightSlot={<a className="nav__link" href="/results">Results</a>}
    >
      <div className="container">
        <div className="panel">
          <div className="results-title">RUN HISTORY</div>

          {error && (
            <div className="panel mt-md" style={{ borderColor: "#f1b3b3", boxShadow: "none" }}>
              <b style={{ color: "crimson" }}>Error:</b> {error}
            </div>
          )}

          {loading ? (
            <p>Loading archive…</p>
          ) : items.length === 0 ? (
            <p className="muted">
              No sealed runs yet. Complete the five rites and finalize to create your first archive entry.
            </p>
          ) : (
            <div className="mt-md" style={{ display: "grid", gap: 12 }}>
              {items.map((it) => (
                <div key={it.runId} className="panel" style={{ boxShadow: "none" }}>
                  <div className="results-title">SEALED RUN</div>

                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 900 }}>
                        {it.legendaryRaveliquarName}
                      </div>
                      <div className="muted small mt-sm">
                        <b>Completed:</b> {formatDate(it.completedAt)}
                      </div>
                      <div className="muted small">
                        <b>RunId:</b> {it.runId}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <a href={`/lore/${encodeURIComponent(it.legendaryRaveliquarName)}`}>
                        Archive Entry →
                      </a>
                      <button
                        onClick={() => {
                          localStorage.setItem("eirden_run", it.runId);
                          window.location.href = "/results";
                        }}
                      >
                        View in Results
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
