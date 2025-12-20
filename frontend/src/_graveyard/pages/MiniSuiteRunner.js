// src/pages/MiniSuiteRunner.js
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../apiClient";

function isBlank(v) {
  return !String(v ?? "").trim();
}

export default function MiniSuiteRunner() {
  const nav = useNavigate();
  const profileId = useMemo(() => localStorage.getItem("eirden_profile") || "", []);

  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState("");

  const [ids, setIds] = useState([]);
  const [index, setIndex] = useState(0);

  const [test, setTest] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  // answers map:
  // - for mcq/true_false/likert/scenario: number (option index)
  // - for fill_blank: string
  const [answers, setAnswers] = useState({}); // { [questionId]: number|string }

  const currentId = ids[index] || "";
  const questions = test?.questions || [];
  const title = test?.title || currentId;

  // ----- boot: load ids -----
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setBootError("");

        if (!profileId) {
          setBootError("No profile found. Go to Dashboard and create a profile first.");
          setLoading(false);
          return;
        }

        const res = await apiGet("/api/mini-tests");
        const list = res?.ids || [];
        if (!Array.isArray(list) || list.length === 0) {
          setBootError("No mini tests found in catalog.");
          setLoading(false);
          return;
        }

        if (!alive) return;
        setIds(list);
        setIndex(0);
        setLoading(false);
      } catch (e) {
        if (!alive) return;
        setBootError(e?.message || "Failed to load mini test index.");
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [profileId]);

  // ----- load current mini test -----
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!currentId) return;

      try {
        setStatus(`Loading ${currentId}…`);
        setError("");
        setTest(null);
        setAnswers({});

        const res = await apiGet(`/api/mini-tests/${currentId}`);

        if (!alive) return;
        setTest(res?.test || null);
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
  }, [currentId]);

  const answeredCount = useMemo(() => {
    return questions.filter((q) => answers[q.id] !== undefined && !isBlank(answers[q.id])).length;
  }, [questions, answers]);

  function setAnswer(qId, value) {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  }

  function validateAllAnswered() {
    if (!questions.length) return "No questions loaded.";

    for (const q of questions) {
      const v = answers[q.id];

      if (q.type === "fill_blank") {
        if (v === undefined || isBlank(v)) return "Please complete all fill-in-the-blank questions.";
      } else {
        if (v === undefined || !Number.isFinite(Number(v)))
          return "Please answer all multiple-choice questions before submitting.";
      }
    }
    return "";
  }

  async function submitCurrent() {
    if (!profileId) return;

    const validation = validateAllAnswered();
    if (validation) {
      setError(validation);
      return;
    }

    setError("");
    setStatus("Submitting…");

    // ordered answers aligned to question order
    // - for fill_blank: string
    // - for others: number index
    const ordered = questions.map((q) => {
      const v = answers[q.id];
      return q.type === "fill_blank" ? String(v ?? "").trim() : Number(v);
    });

    try {
      await apiPost("/api/mini-tests/submit", {
        profileId,
        miniTestId: currentId,
        answers: ordered,
      });

      setStatus("Submitted.");

      // advance
      if (index < ids.length - 1) {
        setIndex((i) => i + 1);
      } else {
        setStatus("Finishing suite…");
        await apiPost("/api/mini-tests/finish", { profileId });
        setStatus("");
        nav("/results");
      }
    } catch (e) {
      setStatus("");
      setError(e?.message || "Submit failed.");
    }
  }

  function backOne() {
    if (index > 0) setIndex((i) => i - 1);
  }

  // ----- render helpers -----
  function renderQuestion(q, idx) {
    const qNum = idx + 1;
    const qType = q.type || "mcq_single";
    const value = answers[q.id];

    // Fill in the blank (text input)
    if (qType === "fill_blank") {
      return (
        <div key={q.id} className="card" style={{ boxShadow: "none" }}>
          <div className="card-header">
            <div className="card-title">
              {qNum}. Fill in the blank
            </div>
            <div className="card-meta">{q.id}</div>
          </div>

          <p style={{ fontWeight: 700, marginBottom: 8 }}>{q.prompt}</p>

          <input
            className="input"
            value={value ?? ""}
            onChange={(e) => setAnswer(q.id, e.target.value)}
            placeholder="Type your answer…"
          />

          <p className="card-meta" style={{ marginTop: 8 }}>
            Tip: spelling matters unless your backend scorer normalizes.
          </p>
        </div>
      );
    }

    // Everything else: radio options
    const options = Array.isArray(q.options) ? q.options : [];

    const friendlyType =
      qType === "likert5"
        ? "Likert (1–5)"
        : qType === "true_false"
        ? "True / False"
        : qType === "scenario_mcq"
        ? "Scenario"
        : "Multiple choice";

    return (
      <div key={q.id} className="card" style={{ boxShadow: "none" }}>
        <div className="card-header">
          <div className="card-title">
            {qNum}. {friendlyType}
          </div>
          <div className="card-meta">{q.id}</div>
        </div>

        <p style={{ fontWeight: 700, marginBottom: 8 }}>{q.prompt}</p>

        {options.map((opt, optIdx) => (
          <label
            key={optIdx}
            style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}
          >
            <input
              type="radio"
              name={q.id}
              checked={Number(value) === optIdx}
              onChange={() => setAnswer(q.id, optIdx)}
            />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  // ----- main render -----
  if (loading) {
    return (
      <div className="card">
        <div className="card-title">Loading Mini Suite…</div>
        <p className="card-meta">Fetching catalog.</p>
      </div>
    );
  }

  if (bootError) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">Mini Suite</div>
          <div className="card-meta">Unavailable</div>
        </div>
        <p style={{ color: "crimson" }}>{bootError}</p>
        <div style={{ marginTop: 12 }}>
          <button className="btn" onClick={() => nav("/")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">Mini Suite Runner</div>
          <div className="card-meta">
            {index + 1} / {ids.length} • {currentId}
          </div>
        </div>

        <p className="card-meta">
          Profile: <b>{profileId}</b>
        </p>

        <div className="hr" />

        {status && <p className="card-meta">{status}</p>}
        {error && <p style={{ color: "crimson", margin: 0 }}>{error}</p>}

        <div className="hr" />

        <div className="card" style={{ boxShadow: "none" }}>
          <div className="card-header">
            <div className="card-title">{title}</div>
            <div className="card-meta">
              {answeredCount}/{questions.length} answered
            </div>
          </div>

          {!test && <p className="card-meta">No test loaded.</p>}

          {questions.map((q, idx) => renderQuestion(q, idx))}

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" onClick={() => nav("/")}>
              Dashboard
            </button>

            <button className="btn" onClick={backOne} disabled={index === 0}>
              Back
            </button>

            <button className="btn btn-primary" onClick={submitCurrent}>
              {index < ids.length - 1 ? "Submit & Next" : "Submit & Finish"}
            </button>
          </div>

          <p className="card-meta" style={{ marginTop: 10 }}>
            Supports: multiple choice, true/false, likert, scenario MCQ, and fill-in-the-blank.
          </p>
        </div>
      </div>
    </div>
  );
}
