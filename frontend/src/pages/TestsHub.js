// frontend/src/pages/TestsHub.js
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

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

export default function TestsHub() {
  const location = useLocation();
  const profileKey = useMemo(() => readProfileKey(location.search), [location.search]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tests, setTests] = useState([]);

  // ✅ Your backend provides: GET /api/tests/catalog
  const endpoint = "/api/tests/catalog";

  async function loadTests() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(endpoint);
      const data = await res.json();

      // Accept common shapes:
      // - { ok:true, tests:[...] }
      // - { ok:true, catalog:[...] }
      // - [...] directly
      const list =
        Array.isArray(data) ? data : safeArr(data?.tests || data?.catalog || data?.items);

      const normalized = list.map((t, idx) => ({
        id: safeStr(t?.id || t?._id || t?.testId || `test_${idx + 1}`),
        title: safeStr(t?.title || t?.name || t?.label || "Untitled Test"),
        description: safeStr(t?.description || t?.desc || ""),
        totalQuestions:
          Number.isFinite(Number(t?.totalQuestions)) ? Number(t.totalQuestions) :
          Number.isFinite(Number(t?.questionCount)) ? Number(t.questionCount) :
          Number.isFinite(Number(t?.questions?.length)) ? Number(t.questions.length) :
          null,
        kind: safeStr(t?.kind || t?.type || ""),
      }));

      setTests(normalized);
    } catch (e) {
      setErr(e?.message || "Failed to load tests catalog");
      setTests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Tests Hub</h1>
          <div className="muted">
            ProfileKey: <code>{profileKey}</code>
          </div>
          <div className="muted small">
            Source: <code>{endpoint}</code>
          </div>
        </div>

        <div className="headerActions">
          <Link className="btn btnGhost" to={`/dashboard?profileKey=${encodeURIComponent(profileKey)}`}>
            Dashboard
          </Link>
          <button className="btn" onClick={loadTests} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {err ? <div className="card error">{err}</div> : null}

      {loading ? (
        <div className="card">Loading tests catalog…</div>
      ) : tests.length === 0 ? (
        <div className="card">
          <div className="cardTitle">No tests returned</div>
          <div className="muted small">
            Your backend says <code>/api/tests/catalog</code> exists. If it returns an empty array,
            we’ll populate the catalog next.
          </div>
        </div>
      ) : (
        <div className="grid">
          {tests.map((t) => (
            <div className="card" key={t.id}>
              <div className="cardHeader">
                <div>
                  <div className="kicker">{t.id}</div>
                  <div className="cardTitle">{t.title}</div>
                  {t.description ? <div className="muted">{t.description}</div> : null}
                </div>

                {/* TestRunner route is /test/:testId */}
                <Link
                  className="btn"
                  to={`/test/${encodeURIComponent(t.id)}?profileKey=${encodeURIComponent(profileKey)}`}
                >
                  Start / Continue
                </Link>
              </div>

              <div className="pillRow">
                {t.kind ? <span className="pill">{t.kind}</span> : null}
                {t.totalQuestions != null ? (
                  <span className="pill">{t.totalQuestions} questions</span>
                ) : (
                  <span className="pill muted">questions unknown</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
