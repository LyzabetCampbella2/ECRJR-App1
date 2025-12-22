// frontend/src/pages/ArchetypeTest.js
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";
import { apiGet } from "../api";

const SCALE = [
  { v: 0, label: "Strongly Disagree" },
  { v: 1, label: "Disagree" },
  { v: 2, label: "Neutral" },
  { v: 3, label: "Agree" },
  { v: 4, label: "Strongly Agree" }
];

export default function ArchetypeTest() {
  const nav = useNavigate();

  const profileId = useMemo(() => localStorage.getItem("eirden_profile") || "", []);

  const [bank, setBank] = useState(null);
  const [loadingBank, setLoadingBank] = useState(false);
  const [bankErr, setBankErr] = useState("");

  const [answers, setAnswers] = useState({}); // qid -> 0..4
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  // Load test bank from backend
  useEffect(() => {
    let alive = true;
    setLoadingBank(true);
    setBankErr("");

    apiGet("/api/testbanks/archetype")
      .then((data) => {
        if (!alive) return;
        setBank(data);
        setAnswers({});
      })
      .catch((e) => {
        if (!alive) return;
        setBankErr(e?.message || "Failed to load test bank");
      })
      .finally(() => {
        if (!alive) return;
        setLoadingBank(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const questions = bank?.questions || [];

  const isComplete = useMemo(() => {
    return questions.every((q) => {
      const qid = q.id || q.qid;
      return qid && answers[qid] !== undefined && answers[qid] !== null;
    });
  }, [questions, answers]);

  const answeredCount = useMemo(() => {
    let c = 0;
    for (const q of questions) {
      const qid = q.id || q.qid;
      if (!qid) continue;
      if (answers[qid] !== undefined && answers[qid] !== null) c++;
    }
    return c;
  }, [questions, answers]);

  function setAnswer(qid, v) {
    setAnswers((prev) => ({ ...prev, [qid]: v }));
  }

  function restart() {
    setAnswers({});
    setError("");
    setStatus("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function finish() {
    if (!bank) return;

    if (!isComplete) {
      setError("Please answer all questions before finishing.");
      return;
    }

    setError("");
    setStatus("Submitting…");

    // Build answers array in bank question order (required by backend)
    const answersArray = questions.map((q) => {
      const qid = q.id || q.qid;
      return answers[qid];
    });

    try {
      const res = await fetch("/api/tests/archetype/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          profileId: profileId || undefined,
          testId: bank.testId || bank.id || "archetype_main",
          answers: answersArray
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || data?.error || "Submit failed");
      }

      // Save v2 result (single archetype outcome)
      const resultPayload = {
        profileId: profileId || undefined,
        submittedAt: new Date().toISOString(),
        testId: data.testId,
        sphereId: data.sphereId,
        familyId: data.familyId,
        archetypeId: data.archetypeId,
        archetypeName: data.archetypeName,
        matchScore: data.matchScore,
        debug: data.debug // optional; remove later if you don’t want it stored
      };

      try {
        localStorage.setItem("lastArchetypeResult_v2", JSON.stringify(resultPayload));
      } catch {}

      setStatus("");
      nav("/archetype/results");
    } catch (e) {
      setStatus("");
      setError(e?.message || "Submit failed");
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="card">
          <h1 style={{ marginTop: 0 }}>{bank?.title || "Archetype Test"}</h1>

          {loadingBank ? (
            <p className="small">Loading questions from backend…</p>
          ) : bankErr ? (
            <div className="card" style={{ borderColor: "crimson" }}>
              <div style={{ fontWeight: 800 }}>Couldn’t load test bank</div>
              <div className="small">{bankErr}</div>
              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn" onClick={() => window.location.reload()}>
                  Reload
                </button>
                <Link className="btn btnGhost" to="/dashboard">
                  Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <p className="small">
              {questions.length} questions • 0–4 scale • answers picked {answeredCount}/{questions.length}
            </p>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn btnGhost" to="/dashboard">
              Dashboard
            </Link>
            <Link className="btn btnGhost" to="/lore">
              Lore Library
            </Link>
            <button className="btn" onClick={restart} disabled={!questions.length || loadingBank}>
              Restart
            </button>
          </div>

          {status && <p className="small">{status}</p>}
          {error && (
            <div className="card" style={{ borderColor: "crimson" }}>
              {error}
            </div>
          )}

          <hr className="hr" />

          {!loadingBank && !bankErr && questions.length === 0 ? (
            <div className="card" style={{ boxShadow: "none" }}>
              <div className="small muted">No questions found in the test bank.</div>
            </div>
          ) : null}

          <div style={{ display: "grid", gap: 12 }}>
            {questions.map((q, i) => {
              const qid = q.id || q.qid;
              const text = q.text || q.prompt || "(Missing question text)";
              return (
                <div key={qid || i} className="card" style={{ boxShadow: "none" }}>
                  <div style={{ fontWeight: 800 }}>
                    {i + 1}. {text}
                  </div>

                  <div style={{ marginTop: 10 }}>
                    {SCALE.map((opt) => (
                      <label key={opt.v} style={{ display: "flex", gap: 10, marginTop: 6 }}>
                        <input
                          type="radio"
                          name={qid}
                          checked={answers[qid] === opt.v}
                          onChange={() => setAnswer(qid, opt.v)}
                          disabled={!qid || loadingBank}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="btn btnPrimary"
              onClick={finish}
              disabled={loadingBank || !!bankErr || !questions.length}
            >
              Finish & Get My Archetype
            </button>
            <Link className="btn" to="/dashboard">
              Back
            </Link>
          </div>

          {!loadingBank && !bankErr && questions.length > 0 ? (
            <p className="small muted" style={{ marginTop: 12 }}>
              Tip: results now come from backend matching (sphere → family → archetype).
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
