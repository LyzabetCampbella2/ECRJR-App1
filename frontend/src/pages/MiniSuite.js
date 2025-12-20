// src/pages/MiniSuite.js
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../apiClient";
import "./MiniSuite.css";

/**
 * MiniSuite.js (FULL)
 * - Runs the 5 Lumi/Shadow mini-tests (lumishadow_mini_1..5)
 * - Loads test catalog + each test's questions
 * - Collects answers
 * - Submits to backend scorer
 *
 * CRITICAL FIX:
 * - Never renders raw objects in JSX (prevents: "Objects are not valid as a React child (found: object with keys {key, text, lum, sha})")
 * - Any explain/notes arrays are rendered as strings (it.text) or JSON fallback
 *
 * Assumes backend endpoints:
 *   GET  /api/mini-tests                      -> { ids: [...] } or { tests: {...} }
 *   GET  /api/mini-tests/:id                  -> { test: { id,title,questions:[...] } } OR { id,title,questions }
 *   POST /api/mini-tests/score                -> { success:true, result:{ topLuminaries, topShadows, totals, explain? } }
 *
 * If your endpoints differ, edit API paths in loadTestById() and scoreSuite().
 */

const DEFAULT_SUITE_IDS = [
  "lumishadow_mini_1",
  "lumishadow_mini_2",
  "lumishadow_mini_3",
  "lumishadow_mini_4",
  "lumishadow_mini_5",
];

function safeText(x) {
  if (x == null) return "";
  if (typeof x === "string") return x;
  if (typeof x === "number") return String(x);
  if (typeof x === "boolean") return x ? "true" : "false";
  if (typeof x === "object") {
    // common shape: { text: "..."}
    if (typeof x.text === "string") return x.text;
    try {
      return JSON.stringify(x);
    } catch {
      return "[object]";
    }
  }
  return String(x);
}

function normalizeCatalogIds(json) {
  // Supports:
  // - { ids: [...] }
  // - { tests: { id: {...}, ... } }
  // - { items: { ... } }
  if (Array.isArray(json?.ids) && json.ids.length) return json.ids;
  if (json?.tests && typeof json.tests === "object") return Object.keys(json.tests);
  if (json?.items && typeof json.items === "object") return Object.keys(json.items);
  return [];
}

function unwrapTest(json) {
  // Supports:
  // - { test: {...} }
  // - { success:true, test:{...} }
  // - direct object { id,title,questions }
  if (!json) return null;
  if (json.test && typeof json.test === "object") return json.test;
  if (json.success && json.test && typeof json.test === "object") return json.test;
  if (typeof json === "object" && json.id && Array.isArray(json.questions)) return json;
  return null;
}

function questionLabel(q, idx) {
  const t = q?.prompt || q?.text || q?.question || "";
  return t || `Question ${idx + 1}`;
}

export default function MiniSuite() {
  const nav = useNavigate();
  const profileId = useMemo(() => localStorage.getItem("eirden_profile") || "", []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [suiteIds, setSuiteIds] = useState(DEFAULT_SUITE_IDS);
  const [idx, setIdx] = useState(0);

  const [activeTest, setActiveTest] = useState(null);
  const [answers, setAnswers] = useState({}); // { [questionId]: value }
  const [completed, setCompleted] = useState([]); // [{testId, answers, raw?}]

  const [status, setStatus] = useState("");

  // Load suite index (optional)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError("");

        // Try to load mini-test index. If it fails, we still run default ids.
        try {
          const index = await apiGet("/api/mini-tests");
          if (!alive) return;
          const ids = normalizeCatalogIds(index);
          if (ids.length) {
            // Prefer your lumishadow tests if present
            const filtered = ids.filter((x) => String(x).toLowerCase().includes("lumishadow"));
            setSuiteIds(filtered.length ? filtered : ids);
          }
        } catch {
          // ignore; keep defaults
        }

        setLoading(false);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Failed to initialize mini suite.");
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function loadTestById(testId) {
    // Try the canonical route you’re using now
    // If your backend uses /api/mini-tests/:id, this is correct
    const res = await apiGet(`/api/mini-tests/${testId}`);
    const test = unwrapTest(res) || res;
    if (!test?.questions) {
      throw new Error(`Mini test payload missing questions for ${testId}`);
    }
    return test;
  }

  // Load current test whenever idx changes
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setError("");
        setStatus("");

        const testId = suiteIds[idx];
        if (!testId) return;

        setStatus(`Loading ${testId}…`);
        const t = await loadTestById(testId);

        if (!alive) return;

        setActiveTest(t);
        setAnswers({});
        setStatus("");
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Failed to load mini test.");
        setStatus("");
      }
    })();

    return () => {
      alive = false;
    };
  }, [idx, suiteIds]);

  const questions = useMemo(() => {
    return Array.isArray(activeTest?.questions) ? activeTest.questions : [];
  }, [activeTest]);

  const orderedAnswers = useMemo(() => {
    // Keep ordering stable based on question list
    return questions.map((q) => answers[q.id]).filter((v) => v !== undefined);
  }, [questions, answers]);

  function setAnswer(qid, value) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  }

  function allAnswered() {
    if (!questions.length) return false;
    return questions.every((q) => answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== "");
  }

  async function submitCurrentTest() {
    setError("");
    if (!activeTest?.id) {
      setError("No active mini test loaded.");
      return;
    }

    if (!allAnswered()) {
      setError("Please answer all questions before continuing.");
      return;
    }

    const testId = activeTest.id;

    // Save completion
    const payload = {
      testId,
      answers: { ...answers }, // keep raw structure
      // Some scorers want arrays; we keep both.
      orderedAnswers: orderedAnswers,
    };

    setCompleted((prev) => [...prev, payload]);

    // Go next or score
    if (idx < suiteIds.length - 1) {
      setIdx((v) => v + 1);
    } else {
      await scoreSuite([...completed, payload]);
    }
  }

  async function scoreSuite(allCompleted) {
    try {
      setStatus("Scoring suite…");
      setError("");

      // Build merged scoring maps if your tests embed lum/sha weights.
      // If your backend scores from raw answers, it can ignore these.
      // We'll send both:
      const suitePayload = {
        profileId: profileId || undefined,
        suiteId: "lumiShadow_mini_suite_v1",
        tests: allCompleted.map((t) => ({
          testId: t.testId,
          answers: t.answers,
          orderedAnswers: t.orderedAnswers,
        })),
      };

      const resp = await apiPost("/api/mini-tests/score", suitePayload);

      // Navigate to Results page; store a copy in localStorage for convenience
      try {
        localStorage.setItem("lastLumiShadowMiniResult_v1", JSON.stringify(resp));
      } catch {
        // ignore
      }

      setStatus("");

      // If your Results page reads backend /api/results/:profileId, you can just go there.
      // Otherwise we pass state so you can use it immediately.
      nav("/results", { state: { miniSuiteResult: resp } });
    } catch (e) {
      setStatus("");
      setError(e?.message || "Failed to score mini suite.");
    }
  }

  function restartSuite() {
    setCompleted([]);
    setIdx(0);
    setAnswers({});
    setError("");
    setStatus("");
  }

  // Safe explain rendering if you keep it on this page (some scorers return explain arrays)
  function renderExplain(explain) {
    if (!Array.isArray(explain) || explain.length === 0) return null;

    return (
      <div className="card" style={{ boxShadow: "none", marginTop: 12 }}>
        <div className="card-title">Explain</div>
        <ul style={{ marginTop: 10 }}>
          {explain.map((it, i) => (
            <li key={it?.key || i}>{safeText(it?.text ?? it)}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card">
        <div className="card-title">Loading Mini Suite…</div>
        <p className="card-meta">Preparing your 5 mini tests.</p>
      </div>
    );
  }

  const currentTestId = suiteIds[idx] || "";
  const total = suiteIds.length || 0;
  const step = Math.min(idx + 1, total);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Luminary / Shadow Mini Suite</div>
        <div className="card-meta">
          Step {step} / {total} • {currentTestId}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        <Link className="btn" to="/">
          Dashboard
        </Link>
        <Link className="btn" to="/lore">
          Lore Index
        </Link>
        <button className="btn" onClick={restartSuite}>
          Restart Suite
        </button>
      </div>

      {status && <p className="card-meta" style={{ marginTop: 12 }}>{status}</p>}
      {error && <p style={{ color: "crimson", marginTop: 12, marginBottom: 0 }}>{error}</p>}

      <div className="hr" />

      {!activeTest ? (
        <p className="card-meta">No active test loaded.</p>
      ) : (
        <>
          <div className="card" style={{ boxShadow: "none" }}>
            <div className="card-header">
              <div className="card-title">{safeText(activeTest.title || activeTest.id)}</div>
              <div className="card-meta">
                {questions.length} questions
              </div>
            </div>

            {Array.isArray(activeTest.description) ? (
              <p className="card-meta">{activeTest.description.map(safeText).join(" ")}</p>
            ) : activeTest.description ? (
              <p className="card-meta">{safeText(activeTest.description)}</p>
            ) : null}
          </div>

          <div className="grid" style={{ marginTop: 12 }}>
            {questions.map((q, qi) => {
              const qid = q.id;
              const type = String(q.type || "SINGLE").toUpperCase();
              const val = answers[qid];

              return (
                <div key={qid} className="card" style={{ boxShadow: "none" }}>
                  <div className="card-title">{questionLabel(q, qi)}</div>
                  {q.help && <p className="card-meta">{safeText(q.help)}</p>}

                  {/* MULTI / SINGLE with options */}
                  {Array.isArray(q.options) && (type === "SINGLE" || type === "MULTI" || type === "MCQ") && (
                    <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                      {q.options.map((opt, oi) => {
                        const oid = opt?.id ?? oi;
                        const otext = safeText(opt?.text ?? opt);

                        if (type === "MULTI") {
                          const arr = Array.isArray(val) ? val : [];
                          const checked = arr.includes(oid);
                          return (
                            <label key={oid} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...arr, oid]
                                    : arr.filter((x) => x !== oid);
                                  setAnswer(qid, next);
                                }}
                              />
                              {otext}
                            </label>
                          );
                        }

                        // SINGLE
                        return (
                          <label key={oid} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input
                              type="radio"
                              name={qid}
                              checked={val === oid}
                              onChange={() => setAnswer(qid, oid)}
                            />
                            {otext}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* FILL / TEXT */}
                  {(type === "FILL" || type === "TEXT" || type === "SHORT") && (
                    <input
                      className="input"
                      style={{ marginTop: 10 }}
                      value={val ?? ""}
                      onChange={(e) => setAnswer(qid, e.target.value)}
                      placeholder={type === "FILL" ? "Fill in the blank…" : "Type your answer…"}
                    />
                  )}

                  {/* UPLOAD (stores a note/url; real file upload can be added later) */}
                  {type === "UPLOAD" && (
                    <input
                      className="input"
                      style={{ marginTop: 10 }}
                      value={val ?? ""}
                      onChange={(e) => setAnswer(qid, e.target.value)}
                      placeholder="Paste an image URL or filename (upload wiring later)…"
                    />
                  )}

                  {/* Fallback if question type is unknown */}
                  {!Array.isArray(q.options) &&
                    !(type === "FILL" || type === "TEXT" || type === "SHORT" || type === "UPLOAD") && (
                      <input
                        className="input"
                        style={{ marginTop: 10 }}
                        value={val ?? ""}
                        onChange={(e) => setAnswer(qid, e.target.value)}
                        placeholder="Answer…"
                      />
                    )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="btn btn-primary"
              onClick={() => submitCurrentTest()}
              disabled={!activeTest?.id || questions.length === 0}
            >
              {idx < suiteIds.length - 1 ? "Continue" : "Finish & Score"}
            </button>

            <button
              className="btn"
              onClick={() => setIdx((v) => Math.max(0, v - 1))}
              disabled={idx === 0}
            >
              Back
            </button>
          </div>

          <div className="hr" />

          <details>
            <summary className="card-meta" style={{ cursor: "pointer" }}>
              Debug: progress
            </summary>
            <pre style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
              {JSON.stringify(
                {
                  profileId,
                  suiteIds,
                  idx,
                  activeTestId: activeTest?.id,
                  completedCount: completed.length,
                  currentAnswers: answers,
                },
                null,
                2
              )}
            </pre>
          </details>
        </>
      )}

      {/* If you ever keep explain results on this page, render safely */}
      
    </div>
  );
}
