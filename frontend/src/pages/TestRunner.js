// frontend/src/pages/TestRunner.js
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

function safeArr(x) {
  return Array.isArray(x) ? x : [];
}
function safeObj(x) {
  return x && typeof x === "object" ? x : {};
}
function safeStr(x) {
  return String(x ?? "").trim();
}
function readProfileKey(search) {
  const sp = new URLSearchParams(search || "");
  return safeStr(sp.get("profileKey")) || "debug_profile";
}
function storageKey(profileKey, testId) {
  return `eirden_testProgress_v2::${profileKey}::${testId}`;
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function hasAnswer(val) {
  const v = safeObj(val);
  if (v.optionId != null && String(v.optionId).length) return true;
  if (Array.isArray(v.optionIds) && v.optionIds.length) return true;
  if (typeof v.text === "string" && v.text.trim().length) return true;
  if (typeof v.value === "number" && Number.isFinite(v.value)) return true;
  if (v.fileName) return true;
  return false;
}

export default function TestRunner() {
  const { testId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const profileKey = useMemo(() => readProfileKey(location.search), [location.search]);
  const lsKey = useMemo(() => storageKey(profileKey, testId), [profileKey, testId]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [test, setTest] = useState(null);
  const [items, setItems] = useState([]); // combined questions+assignments

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // itemId -> value obj

  const [submitting, setSubmitting] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);

  // -----------------------------
  // Load test + restore progress
  // -----------------------------
  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`/api/tests/${encodeURIComponent(testId)}`);
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.message || "Failed to load test");

      const t = data.test || {};
      const q = safeArr(t.questions).map((it, i) => ({
        ...it,
        __kind: "question",
        __order: i,
        id: safeStr(it.id) || `q_${i + 1}`,
      }));
      const a = safeArr(t.assignments).map((it, i) => ({
        ...it,
        __kind: "assignment",
        __order: i,
        id: safeStr(it.id) || `a_${i + 1}`,
      }));

      // merge: questions first, then assignments
      const merged = [...q, ...a];

      setTest(t);
      setItems(merged);

      // restore local progress (if present)
      try {
        const raw = localStorage.getItem(lsKey);
        if (raw) {
          const saved = JSON.parse(raw);
          const savedAnswers = safeObj(saved?.answers);
          const savedIdx = Number(saved?.idx);

          setAnswers(savedAnswers);

          if (Number.isFinite(savedIdx)) {
            setIdx(Math.max(0, Math.min(merged.length - 1, savedIdx)));
          } else {
            setIdx(0);
          }
        } else {
          setIdx(0);
          setAnswers({});
        }
      } catch {
        setIdx(0);
        setAnswers({});
      }
    } catch (e) {
      setErr(e?.message || "Failed to load test");
      setTest(null);
      setItems([]);
      setIdx(0);
      setAnswers({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, profileKey]);

  // -----------------------------
  // Save progress to localStorage
  // -----------------------------
  useEffect(() => {
    if (!items.length) return;
    try {
      localStorage.setItem(
        lsKey,
        JSON.stringify({
          v: 2,
          profileKey,
          testId,
          idx,
          answers,
          savedAt: new Date().toISOString(),
        })
      );
    } catch {
      // ignore
    }
  }, [answers, idx, items.length, lsKey, profileKey, testId]);

  // -----------------------------
  // Helpers
  // -----------------------------
  const current = items[idx] || null;

  const progressText = items.length ? `${idx + 1} / ${items.length}` : "—";
  const answeredCount = useMemo(() => {
    let c = 0;
    for (const it of items) {
      if (hasAnswer(answers[it.id])) c++;
    }
    return c;
  }, [answers, items]);

  function setAnswer(itemId, patch) {
    setAnswers((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || {}), ...patch },
    }));
  }

  function goPrev() {
    setIdx((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setIdx((i) => Math.min(items.length - 1, i + 1));
  }

  function clearProgress() {
    try {
      localStorage.removeItem(lsKey);
    } catch {}
    setAnswers({});
    setIdx(0);
  }

  async function submit() {
    setSubmitting(true);
    setErr("");
    try {
      const payload = {
        profileKey,
        testId,
        answers,
      };

      const res = await fetch("/api/tests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data?.ok) throw new Error(data?.message || "Submit failed");

      const id = data.resultId || data.attemptId || "latest";
      // ✅ Results page assembles latest by profileKey
      navigate(`/results/${encodeURIComponent(id)}?profileKey=${encodeURIComponent(profileKey)}`);
    } catch (e) {
      setErr(e?.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpload(file, itemId) {
    if (!file) return;
    setUploadBusy(true);
    setErr("");
    try {
      const dataUrl = await fileToDataUrl(file);
      setAnswer(itemId, { fileName: file.name, dataUrl });
    } catch (e) {
      setErr(e?.message || "Upload failed");
    } finally {
      setUploadBusy(false);
    }
  }

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">{safeStr(test?.title) || "Test Runner"}</h1>
          <div className="muted">
            Test: <code>{testId}</code> • ProfileKey: <code>{profileKey}</code>
          </div>
          <div className="muted small">
            Progress: <strong>{progressText}</strong> • Answered:{" "}
            <strong>
              {answeredCount}/{items.length || 0}
            </strong>
          </div>
        </div>

        <div className="headerActions">
          <Link className="btn btnGhost" to={`/tests?profileKey=${encodeURIComponent(profileKey)}`}>
            Back to Tests
          </Link>
          <button className="btn btnGhost" onClick={clearProgress} disabled={loading || submitting}>
            Clear Progress
          </button>
        </div>
      </div>

      {loading ? <div className="card">Loading…</div> : null}
      {!loading && err ? <div className="card error">{err}</div> : null}

      {!loading && !err && !current ? (
        <div className="card">
          <div className="cardTitle">No items found</div>
          <div className="muted small">This test has no questions/assignments.</div>
        </div>
      ) : null}

      {!loading && !err && current ? (
        <div className="card">
          <div className="kicker">
            {current.__kind === "assignment" ? "Assignment" : "Question"} • {current.id}
          </div>

          <div className="cardTitle" style={{ marginTop: 6 }}>
            {safeStr(current.prompt || current.title || "Untitled")}
          </div>

          {current.description ? <div className="muted">{current.description}</div> : null}

          <div style={{ marginTop: 14 }}>
            <ItemRenderer
              item={current}
              value={safeObj(answers[current.id])}
              setAnswer={(patch) => setAnswer(current.id, patch)}
              onUpload={(file) => handleUpload(file, current.id)}
              uploadBusy={uploadBusy}
            />
          </div>

          <div className="row" style={{ marginTop: 18 }}>
            <button className="btn btnGhost" onClick={goPrev} disabled={idx <= 0 || submitting}>
              Prev
            </button>
            <button className="btn" onClick={goNext} disabled={idx >= items.length - 1 || submitting}>
              Next
            </button>

            <div style={{ flex: 1 }} />

            <button className="btn" onClick={submit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="card">
          <div className="cardTitle">Jump</div>
          <div className="muted small">Click a number to jump. Green means answered.</div>

          <div className="pillRow" style={{ marginTop: 10, flexWrap: "wrap" }}>
            {items.map((it, i) => {
              const done = hasAnswer(answers[it.id]);
              const active = i === idx;
              return (
                <button
                  key={it.id}
                  className={`pillBtn ${active ? "active" : ""} ${done ? "done" : ""}`}
                  onClick={() => setIdx(i)}
                  type="button"
                  disabled={submitting}
                  title={safeStr(it.prompt || it.title || it.id)}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ItemRenderer({ item, value, setAnswer, onUpload, uploadBusy }) {
  const type = safeStr(item.type) || "text";

  // multiple choice
  if (type === "multiple_choice") {
    const options = safeArr(item.options);
    const selected = safeStr(value.optionId);

    return (
      <div className="stack">
        {options.map((o, idx) => {
          const id = safeStr(o.id) || String(idx + 1);
          const label = safeStr(o.text) || id;
          return (
            <label className="choice" key={id}>
              <input
                type="radio"
                name={`mc_${item.id}`}
                checked={selected === id}
                onChange={() => setAnswer({ optionId: id })}
              />
              <span>{label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  // select multiple
  if (type === "select_multiple") {
    const options = safeArr(item.options);
    const selected = new Set(safeArr(value.optionIds).map((x) => safeStr(x)));

    function toggle(id) {
      const next = new Set(selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setAnswer({ optionIds: Array.from(next) });
    }

    return (
      <div className="stack">
        {options.map((o, idx) => {
          const id = safeStr(o.id) || String(idx + 1);
          const label = safeStr(o.text) || id;
          return (
            <label className="choice" key={id}>
              <input type="checkbox" checked={selected.has(id)} onChange={() => toggle(id)} />
              <span>{label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  // rating 1-5
  if (type === "rating") {
    const v = Number(value.value || 0);
    return (
      <div className="stack">
        <div className="muted small">Choose 1–5</div>
        <div className="row">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              className={`pillBtn ${v === num ? "active" : ""}`}
              onClick={() => setAnswer({ value: num })}
              type="button"
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // upload
  if (type === "upload") {
    const fileName = safeStr(value.fileName);
    const dataUrl = safeStr(value.dataUrl);
    const isImage = dataUrl.startsWith("data:image/");

    return (
      <div className="stack">
        <input
          type="file"
          onChange={(e) => onUpload(e.target.files?.[0] || null)}
          disabled={uploadBusy}
        />
        {uploadBusy ? <div className="muted small">Processing file…</div> : null}
        {fileName ? <div className="muted small">Saved: {fileName}</div> : null}
        {isImage ? (
          <img
            alt="upload preview"
            src={dataUrl}
            style={{ marginTop: 10, maxWidth: "100%", borderRadius: 12 }}
          />
        ) : null}
      </div>
    );
  }

  // default: text
  return (
    <div className="stack">
      <textarea
        className="textarea"
        rows={6}
        placeholder="Type your answer…"
        value={safeStr(value.text)}
        onChange={(e) => setAnswer({ text: e.target.value })}
      />
    </div>
  );
}
