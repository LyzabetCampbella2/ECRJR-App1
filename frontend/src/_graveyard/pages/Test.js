import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TESTS } from "../data/tests";
import { getQuestionsForTest, QUESTION_TYPE } from "../data/questions";
import { getAccess } from "../utils/access";

/**
 * Test Runner
 * - Supports SINGLE, MULTI, FILL, TEXT, UPLOAD
 * - Save/Resume (localStorage)
 * - Submit to backend:
 *    (1) upload files -> urls
 *    (2) submit answers JSON + pilot info
 */

const API_BASE = "http://localhost:5000"; // change if needed

const storageKey = (testId) => `eirden_test_progress__${testId}`;

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

async function uploadFiles({ testId, questionId, files, pilot }) {
  const fd = new FormData();
  fd.append("testId", testId);
  fd.append("questionId", questionId);

  // include pilot info if present
  if (pilot?.code) fd.append("pilotCode", pilot.code);
  if (pilot?.accessLevel) fd.append("pilotLevel", pilot.accessLevel);

  files.forEach((f) => fd.append("files", f));

  const res = await fetch(`${API_BASE}/api/uploads`, {
    method: "POST",
    body: fd,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || "Upload failed");
  }
  return data; // expects { success:true, urls:[...] }
}

async function submitTest({ testId, answers, pilot }) {
  const res = await fetch(`${API_BASE}/api/tests/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ testId, answers, pilot }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || "Submit failed");
  }
  return data;
}

export default function Test() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const meta = useMemo(() => (testId ? TESTS[testId] : null), [testId]);
  const questions = useMemo(() => (testId ? getQuestionsForTest(testId) : []), [testId]);

  const current = questions[index] || null;
  const total = questions.length;
  const progressPct = total > 0 ? Math.round(((index + 1) / total) * 100) : 0;

  const pilot = useMemo(() => {
    const a = getAccess();
    if (!a?.role || a.role !== "pilot") return null;
    return { code: a.code, accessLevel: a.accessLevel || "pilot" };
  }, []);

  // Reset transient UI when test changes
  useEffect(() => {
    setError("");
    setSubmitResult(null);
    setSubmitting(false);
    setShowReview(false);
    setFinished(false);
    setIndex(0);
    setAnswers({});
  }, [testId]);

  // LOAD saved progress
  useEffect(() => {
    if (!testId) return;
    const raw = localStorage.getItem(storageKey(testId));
    const saved = raw ? safeJsonParse(raw) : null;

    if (saved && typeof saved === "object") {
      if (saved.answers && typeof saved.answers === "object") setAnswers(saved.answers);
      if (Number.isInteger(saved.index)) setIndex(saved.index);
      if (typeof saved.finished === "boolean") setFinished(saved.finished);
    }
  }, [testId]);

  // AUTO SAVE progress
  useEffect(() => {
    if (!testId) return;

    const payload = {
      testId,
      index,
      answers,
      finished,
      savedAt: new Date().toISOString(),
      version: 2,
    };
    localStorage.setItem(storageKey(testId), JSON.stringify(payload));
  }, [testId, index, answers, finished]);

  // Helpers
  const getAnswer = (qid) => answers[qid];
  const setAnswer = (qid, value) => setAnswers((prev) => ({ ...prev, [qid]: value }));
  const isOptional = (q) => Boolean(q?.optional);

  const validateQuestion = (q) => {
    if (!q) return { ok: false, message: "No question loaded." };
    if (isOptional(q)) return { ok: true, message: "" };

    const v = getAnswer(q.id);

    if (q.type === QUESTION_TYPE.SINGLE) {
      if (!v) return { ok: false, message: "Please select one option." };
      return { ok: true, message: "" };
    }

    if (q.type === QUESTION_TYPE.MULTI) {
      if (!Array.isArray(v) || v.length === 0) {
        return { ok: false, message: "Please select at least one option." };
      }
      return { ok: true, message: "" };
    }

    if (q.type === QUESTION_TYPE.FILL) {
      const blanks = q.blanks || [];
      if (!v || typeof v !== "object") return { ok: false, message: "Please fill in the blank(s)." };
      for (const b of blanks) {
        const val = (v[b.key] || "").trim();
        if (!val) return { ok: false, message: "Please fill in all blanks." };
      }
      return { ok: true, message: "" };
    }

    if (q.type === QUESTION_TYPE.TEXT) {
      const text = (v || "").trim();
      if (!text) return { ok: false, message: "Please write an answer." };

      const min = q.constraints?.minChars ?? 0;
      const max = q.constraints?.maxChars ?? Infinity;
      if (text.length < min) return { ok: false, message: `Please write at least ${min} characters.` };
      if (text.length > max) return { ok: false, message: `Please keep your answer under ${max} characters.` };

      return { ok: true, message: "" };
    }

    if (q.type === QUESTION_TYPE.UPLOAD) {
      const arr = Array.isArray(v) ? v : [];
      const ok =
        arr.length > 0 &&
        arr.every((x) => typeof x === "string" || x instanceof File);
      if (!ok) return { ok: false, message: "Please upload at least one file." };
      return { ok: true, message: "" };
    }

    return { ok: true, message: "" };
  };

  const goNext = () => {
    setError("");
    const check = validateQuestion(current);
    if (!check.ok) {
      setError(check.message);
      return;
    }

    if (index >= total - 1) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
  };

  const goBack = () => {
    setError("");
    if (index <= 0) return;
    setIndex((i) => i - 1);
  };

  const restart = () => {
    if (testId) localStorage.removeItem(storageKey(testId));
    setIndex(0);
    setAnswers({});
    setError("");
    setFinished(false);
    setShowReview(false);
    setSubmitting(false);
    setSubmitResult(null);
  };

  // SUBMIT
  const handleSubmitToBackend = async () => {
    setError("");
    setSubmitResult(null);
    setSubmitting(true);

    try {
      // 1) Upload files for upload questions (if Files present)
      const uploadQuestions = questions.filter((q) => q.type === QUESTION_TYPE.UPLOAD);
      const uploadedMap = {};

      for (const q of uploadQuestions) {
        const v = answers[q.id];
        const arr = Array.isArray(v) ? v : [];

        // If already URLs, skip
        const alreadyUrls = arr.length > 0 && arr.every((x) => typeof x === "string");
        if (alreadyUrls) continue;

        const files = arr.filter((x) => x instanceof File);
        if (!files.length) continue;

        const up = await uploadFiles({ testId, questionId: q.id, files, pilot });
        uploadedMap[q.id] = up.urls || [];
      }

      // 2) Replace File objects with URLs
      const cleanedAnswers = { ...answers };
      for (const qId of Object.keys(uploadedMap)) {
        cleanedAnswers[qId] = uploadedMap[qId];
      }

      // 3) Submit JSON answers + pilot info
      const res = await submitTest({
        testId,
        answers: cleanedAnswers,
        pilot,
      });

      setSubmitResult(res);
      setAnswers(cleanedAnswers);

      // Clear progress store after successful submit (optional)
      localStorage.removeItem(storageKey(testId));
    } catch (e) {
      setError(e?.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Render type components
  const renderSingle = (q) => {
    const v = getAnswer(q.id) || "";
    return (
      <div style={styles.options}>
        {(q.options || []).map((opt) => (
          <label key={opt.id} style={styles.optionRow}>
            <input
              type="radio"
              name={q.id}
              checked={v === opt.id}
              onChange={() => setAnswer(q.id, opt.id)}
            />
            <span style={styles.optionText}>{opt.text}</span>
          </label>
        ))}
      </div>
    );
  };

  const renderMulti = (q) => {
    const v = getAnswer(q.id);
    const arr = Array.isArray(v) ? v : [];
    const toggle = (optId) => {
      const has = arr.includes(optId);
      const next = has ? arr.filter((x) => x !== optId) : [...arr, optId];
      setAnswer(q.id, next);
    };

    return (
      <div style={styles.options}>
        {(q.options || []).map((opt) => (
          <label key={opt.id} style={styles.optionRow}>
            <input
              type="checkbox"
              checked={arr.includes(opt.id)}
              onChange={() => toggle(opt.id)}
            />
            <span style={styles.optionText}>{opt.text}</span>
          </label>
        ))}
      </div>
    );
  };

  const renderFill = (q) => {
    const v = getAnswer(q.id);
    const obj = v && typeof v === "object" ? v : {};
    const blanks = q.blanks || [];

    return (
      <div style={styles.fillWrap}>
        {blanks.map((b) => (
          <div key={b.key} style={styles.fillRow}>
            <div style={styles.fillLabel}>Blank: {b.key}</div>
            <input
              style={styles.input}
              value={obj[b.key] || ""}
              placeholder={b.placeholder || "Type here"}
              onChange={(e) => setAnswer(q.id, { ...obj, [b.key]: e.target.value })}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderText = (q) => {
    const v = getAnswer(q.id) || "";
    const max = q.constraints?.maxChars ?? 800;
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <textarea
          style={styles.textarea}
          value={v}
          placeholder="Write your answer here…"
          onChange={(e) => setAnswer(q.id, e.target.value)}
          maxLength={max}
          rows={6}
        />
        <div style={styles.charRow}>
          <span style={{ opacity: 0.8 }}>Max {max} chars</span>
          <span style={{ opacity: 0.8 }}>
            {String(v).length}/{max}
          </span>
        </div>
      </div>
    );
  };

  const renderUpload = (q) => {
    const v = getAnswer(q.id);
    const arr = Array.isArray(v) ? v : [];
    const upload = q.upload || {};
    const accept = (upload.accept || ["image/*", "video/*"]).join(",");
    const maxFiles = upload.maxFiles ?? 1;

    const isUrlList = arr.length > 0 && arr.every((x) => typeof x === "string");

    const onPick = (e) => {
      const picked = Array.from(e.target.files || []);
      if (!picked.length) return;

      const currentFiles = arr.filter((x) => x instanceof File);
      const combined = [...currentFiles, ...picked].slice(0, maxFiles);
      setAnswer(q.id, combined);

      e.target.value = "";
    };

    const removeAt = (i) => {
      const next = arr.filter((_, idx) => idx !== i);
      setAnswer(q.id, next);
    };

    return (
      <div style={{ display: "grid", gap: 10 }}>
        <div style={styles.uploadBox}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Upload</div>
          <div style={{ opacity: 0.85, fontSize: 13, lineHeight: 1.4 }}>
            Accepted: {(upload.accept || ["image/*", "video/*"]).join(", ")}
            <br />
            Max files: {maxFiles}
            {upload.maxSizeMB ? (
              <>
                <br />
                Max size per file: {upload.maxSizeMB}MB
              </>
            ) : null}
          </div>

          {!isUrlList ? (
            <input
              type="file"
              accept={accept}
              multiple={maxFiles > 1}
              onChange={onPick}
              style={{ marginTop: 10 }}
              disabled={submitting}
            />
          ) : (
            <div style={{ marginTop: 10, opacity: 0.8, fontSize: 13 }}>
              Already uploaded (stored as URLs). Restart to replace.
            </div>
          )}
        </div>

        {arr.length ? (
          <div style={styles.fileList}>
            {arr.map((item, i) => {
              const isUrl = typeof item === "string";
              return (
                <div key={`${isUrl ? item : item.name}-${i}`} style={styles.fileRow}>
                  <div style={{ display: "grid" }}>
                    <span style={{ fontWeight: 800 }}>
                      {isUrl ? item : item.name}
                    </span>
                    {!isUrl ? (
                      <span style={{ opacity: 0.8, fontSize: 12 }}>
                        {(item.size / (1024 * 1024)).toFixed(2)} MB · {item.type || "unknown type"}
                      </span>
                    ) : (
                      <span style={{ opacity: 0.8, fontSize: 12 }}>uploaded url</span>
                    )}
                  </div>
                  <button style={styles.smallBtn} onClick={() => removeAt(i)} disabled={submitting}>
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ opacity: 0.75, fontSize: 13 }}>No files selected yet.</div>
        )}
      </div>
    );
  };

  const renderQuestionBody = (q) => {
    if (!q) return null;
    switch (q.type) {
      case QUESTION_TYPE.SINGLE:
        return renderSingle(q);
      case QUESTION_TYPE.MULTI:
        return renderMulti(q);
      case QUESTION_TYPE.FILL:
        return renderFill(q);
      case QUESTION_TYPE.TEXT:
        return renderText(q);
      case QUESTION_TYPE.UPLOAD:
        return renderUpload(q);
      default:
        return <div style={{ opacity: 0.8 }}>Unsupported question type: {q.type}</div>;
    }
  };

  const renderReview = () => (
    <div style={styles.reviewBox}>
      <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 10 }}>Answers (local)</div>
      <div style={{ display: "grid", gap: 10 }}>
        {questions.map((q) => {
          const v = answers[q.id];
          let display = "";

          if (q.type === QUESTION_TYPE.UPLOAD) {
            const fs = Array.isArray(v) ? v : [];
            display = fs.length ? fs.map((x) => (typeof x === "string" ? x : x.name)).join(", ") : "(none)";
          } else if (q.type === QUESTION_TYPE.MULTI) {
            display = Array.isArray(v) ? v.join(", ") : "(none)";
          } else if (q.type === QUESTION_TYPE.FILL) {
            display = v && typeof v === "object" ? JSON.stringify(v) : "(none)";
          } else {
            display = v ? String(v) : "(none)";
          }

          return (
            <div key={q.id} style={styles.reviewRow}>
              <div style={{ fontWeight: 800 }}>{q.id}</div>
              <div style={{ opacity: 0.9, lineHeight: 1.4 }}>{q.prompt}</div>
              <div style={styles.reviewVal}>{display}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Guards
  if (!testId) {
    return (
      <div style={styles.page}>
        <div style={styles.card}><h2>Missing testId…</h2></div>
      </div>
    );
  }

  if (!meta) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1>Unknown Test</h1>
          <p style={{ opacity: 0.85 }}>Test ID: {testId}</p>
          <button style={styles.btn} onClick={() => navigate("/test/start")}>Back to Test Start</button>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1>{meta.title}</h1>
          <p style={{ opacity: 0.85 }}>No questions exist yet for this test.</p>
          <button style={styles.btn} onClick={() => navigate("/test/start")}>Back to Test Start</button>
        </div>
      </div>
    );
  }

  // Finished screen
  if (finished) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={{ marginTop: 0 }}>Finished: {meta.title}</h1>

          {pilot ? (
            <div style={styles.badge}>
              Pilot Tester · {pilot.accessLevel}
            </div>
          ) : null}

          <p style={{ opacity: 0.85 }}>
            You answered {Object.keys(answers).length} / {questions.length} questions.
          </p>

          {error ? <div style={styles.error}>{error}</div> : null}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <button
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={() => setShowReview((s) => !s)}
              disabled={submitting}
            >
              {showReview ? "Hide Answers" : "View Answers"}
            </button>

            <button
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={handleSubmitToBackend}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit to Backend"}
            </button>

            <button style={styles.btn} onClick={restart} disabled={submitting}>
              Restart
            </button>

            <button style={styles.btn} onClick={() => navigate("/test/start")} disabled={submitting}>
              Back to Test Start
            </button>
          </div>

          {showReview ? renderReview() : null}

          {submitResult ? (
            <div style={styles.nextBox}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Submitted ✅</div>
              <div style={{ opacity: 0.85, lineHeight: 1.5 }}>
                {JSON.stringify(submitResult)}
              </div>
            </div>
          ) : (
            <div style={styles.nextBox}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Saved ✅</div>
              <div style={{ opacity: 0.85, lineHeight: 1.5 }}>
                Your progress is auto-saved. You can refresh and resume anytime.
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active screen
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.topRow}>
          <div>
            <div style={styles.kicker}>{meta.id}</div>
            <h1 style={styles.h1}>{meta.title}</h1>
            <div style={styles.sub}>{meta.description}</div>

            {pilot ? (
              <div style={{ marginTop: 10 }}>
                <span style={styles.badge}>Pilot Tester · {pilot.accessLevel}</span>
              </div>
            ) : null}
          </div>

          <button style={styles.btn} onClick={() => navigate("/test/start")}>
            Change Test
          </button>
        </div>

        <div style={styles.progressWrap}>
          <div style={styles.progressLabel}>
            Question {index + 1} of {total}
            <span style={{ opacity: 0.7 }}> · {progressPct}%</span>
          </div>
          <div style={styles.progressBarOuter}>
            <div style={{ ...styles.progressBarInner, width: `${progressPct}%` }} />
          </div>
        </div>

        <div style={styles.qBox}>
          <div style={styles.qMetaRow}>
            <span style={styles.qId}>{current.id}</span>
            <span style={styles.qType}>
              {current.type}
              {isOptional(current) ? " · optional" : ""}
            </span>
          </div>

          <div style={styles.prompt}>{current.prompt}</div>
          <div style={{ marginTop: 14 }}>{renderQuestionBody(current)}</div>

          {error ? <div style={styles.error}>{error}</div> : null}

          <div style={styles.navRow}>
            <button style={styles.btn} onClick={goBack} disabled={index === 0 || submitting}>
              Back
            </button>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                style={styles.btn}
                onClick={() => {
                  if (!isOptional(current)) {
                    setError("This question is required. Please answer it to continue.");
                    return;
                  }
                  setError("");
                  goNext();
                }}
                disabled={submitting}
              >
                Skip
              </button>

              <button
                style={{ ...styles.btn, ...styles.btnPrimary }}
                onClick={goNext}
                disabled={submitting}
              >
                {index === total - 1 ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </div>

        <div style={styles.footerHint}>
          Auto-saved. Refresh-safe URL: <strong>/test/{meta.id}</strong>
        </div>
      </div>
    </div>
  );
}

// Styles
const styles = {
  page: {
    minHeight: "100vh",
    padding: 24,
    background: "#0b0f1a",
    color: "#e9ecf1",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  },
  card: {
    maxWidth: 980,
    margin: "0 auto",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 22,
    background: "rgba(255,255,255,0.04)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 14,
  },
  kicker: { fontSize: 12, opacity: 0.75, marginBottom: 6 },
  h1: { margin: 0, fontSize: 28 },
  sub: { marginTop: 8, opacity: 0.85, lineHeight: 1.4 },

  badge: {
    display: "inline-block",
    marginTop: 10,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(120,255,160,0.25)",
    background: "rgba(120,255,160,0.06)",
    fontWeight: 800,
    fontSize: 12,
  },

  progressWrap: { marginTop: 14, marginBottom: 16, display: "grid", gap: 8 },
  progressLabel: { fontSize: 13, opacity: 0.85 },
  progressBarOuter: {
    height: 10,
    borderRadius: 999,
    background: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  progressBarInner: {
    height: "100%",
    borderRadius: 999,
    background: "rgba(120,140,255,0.75)",
  },

  qBox: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    padding: 16,
  },
  qMetaRow: { display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 },
  qId: {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.18)",
    opacity: 0.95,
  },
  qType: { fontSize: 12, opacity: 0.8, paddingTop: 6 },

  prompt: { fontSize: 16, fontWeight: 800, lineHeight: 1.35 },

  options: { display: "grid", gap: 10 },
  optionRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
  },
  optionText: { lineHeight: 1.35, opacity: 0.95 },

  fillWrap: { display: "grid", gap: 12 },
  fillRow: { display: "grid", gap: 6 },
  fillLabel: { fontSize: 12, opacity: 0.8 },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.25)",
    color: "#e9ecf1",
    outline: "none",
  },

  textarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.25)",
    color: "#e9ecf1",
    outline: "none",
    resize: "vertical",
  },
  charRow: { display: "flex", justifyContent: "space-between", fontSize: 12 },

  uploadBox: {
    padding: 12,
    borderRadius: 12,
    border: "1px dashed rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.03)",
  },
  fileList: { display: "grid", gap: 8 },
  fileRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
  },
  smallBtn: {
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#e9ecf1",
    borderRadius: 10,
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 700,
  },

  error: {
    marginTop: 14,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,80,80,0.35)",
    background: "rgba(255,80,80,0.12)",
    color: "#ffd7d7",
  },

  navRow: {
    marginTop: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  btn: {
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#e9ecf1",
    borderRadius: 12,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
  },
  btnPrimary: {
    background: "rgba(120,140,255,0.25)",
    border: "1px solid rgba(120,140,255,0.40)",
  },

  footerHint: { marginTop: 14, opacity: 0.75, fontSize: 12 },

  reviewBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
  },
  reviewRow: {
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    display: "grid",
    gap: 6,
  },
  reviewVal: {
    fontSize: 13,
    opacity: 0.9,
    borderTop: "1px solid rgba(255,255,255,0.08)",
    paddingTop: 8,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },

  nextBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
  },
};
