// src/pages/MiniSuite.js
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  apiGet,
  apiPost,
  apiUploadImage,
  toAbsoluteUrl,
} from "../apiClient";

/**
 * MiniSuite.js (single-page runner + renderer)
 * -------------------------------------------
 * Runs the 5 Luminary/Shadow mini tests in sequence and supports:
 *  - SINGLE (radio)
 *  - MULTI (checkbox)
 *  - FILL (short text)
 *  - TEXT (long text)
 *  - SCALE (slider)
 *  - UPLOAD (REAL image upload -> /api/uploads/image -> /uploads/...)
 *
 * Backend endpoints assumed (match your current server mounts):
 *  - GET  /api/mini-tests/:id           -> { ok:true, test:{...}, questions:[...] }
 *  - POST /api/mini-tests/submit        -> { ok:true, result:{...} }   (optional)
 *  - POST /api/mini-tests/score         -> { ok:true, result:{...} }   (preferred)
 *  - POST /api/mini-tests/finish        -> { ok:true, result:{...} }   (suite aggregate)
 *
 * If your backend uses slightly different names, change only the endpoint strings
 * in scoreCurrent() and finishSuite().
 */

// ----- Suite config (5 mini tests) -----
const SUITE_IDS = [
  "lumishadow_mini_1",
  "lumishadow_mini_2",
  "lumishadow_mini_3",
  "lumishadow_mini_4",
  "lumishadow_mini_5",
];

const LS_PROFILE = "eirden_profile";
const LS_MINI_SUITE_PROGRESS = "eirden_lumishadow_suite_progress_v2";

const QUESTION_TYPE = {
  SINGLE: "SINGLE",
  MULTI: "MULTI",
  FILL: "FILL",
  TEXT: "TEXT",
  SCALE: "SCALE",
  UPLOAD: "UPLOAD",
};

function safeText(x) {
  if (x == null) return "";
  if (typeof x === "string" || typeof x === "number") return String(x);
  try {
    return JSON.stringify(x);
  } catch {
    return String(x);
  }
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) return [];
  if (options.length === 0) return [];
  if (typeof options[0] === "string") {
    return options.map((t, i) => ({ id: String(i), text: t }));
  }
  return options.map((o, i) => ({
    id: String(o?.id ?? o?.value ?? i),
    text: String(o?.text ?? o?.label ?? o?.value ?? ""),
    // allow scoring metadata (optional)
    lum: o?.lum,
    sha: o?.sha,
  }));
}

function isAnswered(q, ans) {
  const t = q?.type;
  if (t === QUESTION_TYPE.MULTI) return Array.isArray(ans) && ans.length > 0;
  if (t === QUESTION_TYPE.SINGLE) return ans !== undefined && ans !== null && ans !== "";
  if (t === QUESTION_TYPE.FILL) return String(ans || "").trim().length > 0;
  if (t === QUESTION_TYPE.TEXT) return String(ans || "").trim().length > 0;
  if (t === QUESTION_TYPE.SCALE) return Number.isFinite(Number(ans));
  if (t === QUESTION_TYPE.UPLOAD) return !!ans?.url;
  return ans !== undefined && ans !== null;
}

function ProgressBar({ label, current, total }) {
  const pct = total ? Math.round((current / total) * 100) : 0;
  return (
    <div style={{ marginTop: 10 }}>
      <div className="card-meta">
        {label} <b>{current}</b> / {total} ({pct}%)
      </div>
      <div
        style={{
          height: 10,
          borderRadius: 999,
          border: "1px solid var(--line)",
          background: "rgba(255,255,255,0.55)",
          overflow: "hidden",
          marginTop: 8,
        }}
      >
        <div
          style={{
            width: `${Math.max(0, Math.min(100, pct))}%`,
            height: "100%",
            background: "rgba(31,58,46,0.55)",
          }}
        />
      </div>
    </div>
  );
}

function UploadRenderer({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErr("");
    setBusy(true);
    try {
      const res = await apiUploadImage(file);
      const f = res?.file || {};
      if (!f.url) throw new Error("Upload succeeded but URL missing.");

      onChange({
        url: f.url, // "/uploads/xxx.png"
        originalName: f.originalName,
        filename: f.filename,
        mimetype: f.mimetype,
        size: f.size,
      });
    } catch (ex) {
      setErr(ex?.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <input type="file" accept="image/*" onChange={handleFile} disabled={busy} />

      {busy && <div className="card-meta">Uploading…</div>}
      {err && <div style={{ color: "crimson" }}>{err}</div>}

      {value?.url && (
        <div className="card" style={{ boxShadow: "none" }}>
          <div className="card-meta">Uploaded:</div>
          <div className="card-meta">
            {value.originalName || value.filename || value.url}
          </div>
          <img
            src={toAbsoluteUrl(value.url)}
            alt="upload preview"
            style={{ width: "100%", maxWidth: 680, borderRadius: 12, marginTop: 10 }}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <a className="btn" href={toAbsoluteUrl(value.url)} target="_blank" rel="noreferrer">
              Open file
            </a>
            <button className="btn" type="button" onClick={() => onChange(null)}>
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MiniSuite() {
  const nav = useNavigate();

  const profileId = useMemo(() => localStorage.getItem(LS_PROFILE) || "", []);

  // Restore progress if present
  const restored = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_MINI_SUITE_PROGRESS) || "null");
    } catch {
      return null;
    }
  }, []);

  const [suiteIndex, setSuiteIndex] = useState(
    Number.isFinite(restored?.suiteIndex) ? restored.suiteIndex : 0
  );
  const [questionIndex, setQuestionIndex] = useState(
    Number.isFinite(restored?.questionIndex) ? restored.questionIndex : 0
  );
  const [answers, setAnswers] = useState(restored?.answers || {});
  const [submissions, setSubmissions] = useState(restored?.submissions || []);
  const [latestScore, setLatestScore] = useState(restored?.latestScore || null);

  const [testMeta, setTestMeta] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const currentMiniId = SUITE_IDS[Math.max(0, Math.min(SUITE_IDS.length - 1, suiteIndex))];
  const totalMini = SUITE_IDS.length;

  const currentQ = questions[questionIndex] || null;

  // Persist progress
  useEffect(() => {
    localStorage.setItem(
      LS_MINI_SUITE_PROGRESS,
      JSON.stringify({
        suiteIndex,
        questionIndex,
        answers,
        submissions,
        latestScore,
      })
    );
  }, [suiteIndex, questionIndex, answers, submissions, latestScore]);

  // Load current mini test
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        setStatus("");

        const res = await apiGet(`/api/mini-tests/${encodeURIComponent(currentMiniId)}`);

        if (!alive) return;

        const qsRaw = Array.isArray(res?.questions) ? res.questions : [];
        const qs = qsRaw.map((q) => ({
          ...q,
          id: q.id || q.questionId, // tolerate variants
          type: q.type || QUESTION_TYPE.SINGLE,
          options: normalizeOptions(q.options),
          scaleMax: Number(q.scaleMax || 5),
        }));

        setTestMeta(res?.test || { id: currentMiniId, title: currentMiniId });
        setQuestions(qs);

        // Clamp question index
        setQuestionIndex((prev) => Math.max(0, Math.min(prev, Math.max(0, qs.length - 1))));

        setLoading(false);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Failed to load mini test.");
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [currentMiniId]);

  const answeredCount = useMemo(() => {
    let n = 0;
    for (const q of questions) {
      if (isAnswered(q, answers[q.id])) n++;
    }
    return n;
  }, [questions, answers]);

  function setAnswer(qId, v) {
    setAnswers((prev) => ({ ...prev, [qId]: v }));
  }

  function clearAnswer(qId) {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
  }

  function goPrevQ() {
    setQuestionIndex((i) => Math.max(0, i - 1));
  }

  function goNextQ() {
    setQuestionIndex((i) => Math.min(Math.max(0, questions.length - 1), i + 1));
  }

  function resetSuite() {
    localStorage.removeItem(LS_MINI_SUITE_PROGRESS);
    setSuiteIndex(0);
    setQuestionIndex(0);
    setAnswers({});
    setSubmissions([]);
    setLatestScore(null);
    setError("");
    setStatus("");
  }

  function normalizeAnswersForSubmit() {
    // Send a clean, deterministic list (backend-friendly).
    // Upload -> url only
    // Multi -> array
    // Single -> optionId string
    // Text/fill -> string
    // Scale -> number
    return questions.map((q) => {
      const a = answers[q.id];

      if (q.type === QUESTION_TYPE.UPLOAD) {
        return { questionId: q.id, value: a?.url || "" };
      }
      if (q.type === QUESTION_TYPE.MULTI) {
        return { questionId: q.id, value: Array.isArray(a) ? a : [] };
      }
      if (q.type === QUESTION_TYPE.SCALE) {
        return { questionId: q.id, value: Number.isFinite(Number(a)) ? Number(a) : 0 };
      }
      return { questionId: q.id, value: a ?? "" };
    });
  }

  async function scoreCurrent() {
    try {
      setError("");
      setStatus("");
      setLatestScore(null);

      if (!profileId) {
        throw new Error("No profile found. Go to Dashboard and create a profile first.");
      }
      if (questions.length === 0) {
        throw new Error("No questions loaded.");
      }

      const missing = questions.filter((q) => !isAnswered(q, answers[q.id]));
      if (missing.length > 0) {
        throw new Error(`Please answer all questions. Missing: ${missing.length}`);
      }

      setBusy(true);
      setStatus("Scoring this mini test…");

      const payload = {
        profileId,
        miniTestId: currentMiniId,
        answers: normalizeAnswersForSubmit(),
      };

      // Preferred scoring endpoint
      // If your backend uses /submit instead, change this to "/api/mini-tests/submit"
      const res = await apiPost("/api/mini-tests/score", payload);

      // Store submission record locally for UI + resume
      const record = {
        miniTestId: currentMiniId,
        at: new Date().toISOString(),
        result: res?.result || null,
      };

      setLatestScore(res?.result || null);
      setSubmissions((prev) => {
        const next = [...prev];
        // replace if re-scored
        const idx = next.findIndex((x) => x.miniTestId === currentMiniId);
        if (idx >= 0) next[idx] = record;
        else next.push(record);
        return next;
      });

      setStatus("Scored. You can continue.");
    } catch (e) {
      setError(e?.message || "Scoring failed.");
    } finally {
      setBusy(false);
    }
  }

  async function continueToNextMini() {
    // If last mini, finish suite
    if (suiteIndex >= totalMini - 1) {
      await finishSuite();
      return;
    }

    // Move forward, reset question progress + answers
    setSuiteIndex((i) => i + 1);
    setQuestionIndex(0);
    setAnswers({});
    setLatestScore(null);
    setStatus("");
    setError("");
  }

  async function finishSuite() {
    try {
      setError("");
      setBusy(true);
      setStatus("Finishing suite…");

      if (!profileId) throw new Error("No profile found. Create a profile first.");

      // This endpoint should aggregate totals and mark suiteStatus finished.
      // If your backend expects no payload, you can send only {profileId}.
      const res = await apiPost("/api/mini-tests/finish", { profileId });

      setStatus("Suite complete.");
      localStorage.removeItem(LS_MINI_SUITE_PROGRESS);

      // Send user to Results page (your Results.js pulls /api/results/:profileId)
      nav("/results", { state: { suiteResult: res } });
    } catch (e) {
      setError(e?.message || "Finish failed.");
    } finally {
      setBusy(false);
    }
  }

  function renderQuestion(q) {
    if (!q) return null;

    const value = answers[q.id];
    const totalQ = questions.length;

    return (
      <div className="card" style={{ boxShadow: "none" }}>
        <div className="card-header">
          <div className="card-title">{safeText(q.prompt || q.text || "Question")}</div>
          <div className="card-meta">
            {questionIndex + 1} / {totalQ}
          </div>
        </div>

        {q.help && <p className="card-meta">{safeText(q.help)}</p>}

        {q.type === QUESTION_TYPE.SINGLE && (
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {q.options.map((opt) => (
              <label key={opt.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="radio"
                  name={q.id}
                  checked={value === opt.id}
                  onChange={() => setAnswer(q.id, opt.id)}
                />
                <span>{safeText(opt.text)}</span>
              </label>
            ))}
          </div>
        )}

        {q.type === QUESTION_TYPE.MULTI && (
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {q.options.map((opt) => {
              const arr = Array.isArray(value) ? value : [];
              const checked = arr.includes(opt.id);
              return (
                <label key={opt.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked ? arr.filter((x) => x !== opt.id) : [...arr, opt.id];
                      setAnswer(q.id, next);
                    }}
                  />
                  <span>{safeText(opt.text)}</span>
                </label>
              );
            })}
          </div>
        )}

        {q.type === QUESTION_TYPE.FILL && (
          <div style={{ marginTop: 12 }}>
            <input
              value={value || ""}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              placeholder="Type your answer…"
              style={{ width: "100%" }}
            />
          </div>
        )}

        {q.type === QUESTION_TYPE.TEXT && (
          <div style={{ marginTop: 12 }}>
            <textarea
              value={value || ""}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              placeholder="Write here…"
              rows={6}
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>
        )}

        {q.type === QUESTION_TYPE.SCALE && (
          <div style={{ marginTop: 12 }}>
            <div className="card-meta" style={{ marginBottom: 8 }}>
              Value: <b>{Number.isFinite(Number(value)) ? Number(value) : 0}</b> / {q.scaleMax}
            </div>
            <input
              type="range"
              min={0}
              max={q.scaleMax}
              value={Number.isFinite(Number(value)) ? Number(value) : 0}
              onChange={(e) => setAnswer(q.id, Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
        )}

        {q.type === QUESTION_TYPE.UPLOAD && (
          <div style={{ marginTop: 12 }}>
            <UploadRenderer value={value} onChange={(v) => setAnswer(q.id, v)} />
          </div>
        )}

        {!Object.values(QUESTION_TYPE).includes(q.type) && (
          <p style={{ color: "crimson" }}>
            Unknown question type: <b>{safeText(q.type)}</b>
          </p>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <button className="btn" onClick={goPrevQ} disabled={questionIndex === 0}>
            Back
          </button>
          <button
            className="btn btn-primary"
            onClick={goNextQ}
            disabled={questionIndex >= totalQ - 1}
          >
            Next
          </button>

          <div style={{ flex: 1 }} />

          <button className="btn" type="button" onClick={() => clearAnswer(q.id)}>
            Clear
          </button>
        </div>

        {!isAnswered(q, answers[q.id]) && (
          <p className="card-meta" style={{ marginTop: 10 }}>
            Tip: answer this question to improve scoring accuracy.
          </p>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card">
        <div className="card-title">Loading Mini Suite…</div>
        <p className="card-meta">Preparing your Luminary/Shadow suite.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Luminary / Shadow Mini Suite</div>
        <div className="card-meta">
          Mini {suiteIndex + 1} / {totalMini}
        </div>
      </div>

      <p className="card-meta" style={{ marginTop: 6 }}>
        Current test: <b>{safeText(testMeta?.title || currentMiniId)}</b>{" "}
        <span style={{ opacity: 0.7 }}>({currentMiniId})</span>
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        <Link className="btn" to="/">
          Dashboard
        </Link>
        <Link className="btn" to="/lore">
          Lore Index
        </Link>
        <Link className="btn" to="/results">
          Results
        </Link>
        <button className="btn" type="button" onClick={resetSuite} disabled={busy}>
          Reset Suite
        </button>
      </div>

      <div className="hr" />

      <ProgressBar label="Answered:" current={answeredCount} total={questions.length} />
      <ProgressBar label="Suite:" current={suiteIndex} total={totalMini - 1} />

      {status && <p className="card-meta" style={{ marginTop: 10 }}>{status}</p>}
      {error && <p style={{ color: "crimson", marginTop: 10 }}>{safeText(error)}</p>}

      <div className="hr" />

      {questions.length === 0 ? (
        <p className="card-meta">No questions found for this mini test.</p>
      ) : (
        renderQuestion(currentQ)
      )}

      <div className="hr" />

      {/* Actions: score, continue */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={scoreCurrent} disabled={busy || questions.length === 0}>
          Score This Mini Test
        </button>

        <button
          className="btn"
          onClick={continueToNextMini}
          disabled={busy || !latestScore}
          title={!latestScore ? "Score first to continue" : ""}
        >
          {suiteIndex >= totalMini - 1 ? "Finish Suite" : "Continue to Next Mini"}
        </button>
      </div>

      {latestScore && (
        <div className="card" style={{ boxShadow: "none", marginTop: 14 }}>
          <div className="card-header">
            <div className="card-title">Latest Score</div>
            <div className="card-meta">{currentMiniId}</div>
          </div>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
            {JSON.stringify(latestScore, null, 2)}
          </pre>
        </div>
      )}

      <details style={{ marginTop: 14 }}>
        <summary className="card-meta" style={{ cursor: "pointer" }}>
          Debug: suite state
        </summary>
        <pre style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>
          {JSON.stringify(
            {
              profileId,
              currentMiniId,
              suiteIndex,
              questionIndex,
              answeredCount,
              questions: questions.length,
              submissions: submissions.length,
            },
            null,
            2
          )}
        </pre>
      </details>
    </div>
  );
}
