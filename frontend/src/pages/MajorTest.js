// frontend/src/pages/MajorTest.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const LS_PROGRESS_PREFIX = "majorProgress_v3_";
const LS_RESULT = "lastMajorTestResult_v1";

const TYPES = ["single", "multi", "scale", "rank", "text", "file", "check"];
const TYPE_LABEL = {
  single: "Single",
  multi: "Multi",
  scale: "Scale",
  rank: "Rank",
  text: "Text",
  file: "File",
  check: "Check",
};

const PAGE_SIZE_DEFAULT = 5;

async function fetchBank() {
  const res = await fetch("/api/major-test/bank");
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.message || "Failed to load bank");
  return data.bank;
}

async function uploadFile(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.message || "Upload failed");
  return data; // { fileKey, url, ... }
}

async function submitMajor(profileKey, answers, meta) {
  const res = await fetch("/api/major-test/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profileKey, answers, meta }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.message || "Submit failed");
  return data.result;
}

function clamp(n, a, b) {
  const x = Number(n);
  if (!Number.isFinite(x)) return a;
  return Math.max(a, Math.min(b, x));
}

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function MajorTest() {
  const nav = useNavigate();

  const [bank, setBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [profileKey, setProfileKey] = useState("debug_profile");
  const [day, setDay] = useState(1);
  const [type, setType] = useState("single");
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [page, setPage] = useState(0);

  // answers: { [questionId]: {questionId, ...payload} }
  const [ans, setAns] = useState({});
  const [bestOfFileKey, setBestOfFileKey] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load bank
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");
    fetchBank()
      .then((b) => alive && setBank(b))
      .catch((e) => alive && setErr(e.message || String(e)))
      .finally(() => alive && setLoading(false));
    return () => (alive = false);
  }, []);

  // Load progress when profileKey changes
  useEffect(() => {
    const key = LS_PROGRESS_PREFIX + profileKey;
    const raw = localStorage.getItem(key);
    if (!raw) return;

    const saved = safeParse(raw);
    if (!saved || typeof saved !== "object") return;

    if (saved.ans && typeof saved.ans === "object") setAns(saved.ans);
    if (Number.isFinite(Number(saved.day))) setDay(Number(saved.day));
    if (typeof saved.type === "string" && TYPES.includes(saved.type)) setType(saved.type);
    if (Number.isFinite(Number(saved.page))) setPage(Number(saved.page));
    if (Number.isFinite(Number(saved.pageSize))) setPageSize(Number(saved.pageSize));
    if (typeof saved.bestOfFileKey === "string") setBestOfFileKey(saved.bestOfFileKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileKey]);

  // Autosave progress
  useEffect(() => {
    const key = LS_PROGRESS_PREFIX + profileKey;
    const payload = {
      updatedAt: Date.now(),
      day,
      type,
      page,
      pageSize,
      bestOfFileKey,
      ans,
    };
    localStorage.setItem(key, JSON.stringify(payload));
  }, [profileKey, day, type, page, pageSize, bestOfFileKey, ans]);

  const questions = useMemo(() => asArray(bank?.questions), [bank]);

  const scheduleByDay = useMemo(() => {
    const map = {};
    for (const d of asArray(bank?.majorSchedule?.days)) map[d.day] = d;
    return map;
  }, [bank]);

  const filtered = useMemo(() => {
    const list = questions
      .filter((q) => Number(q.day) === Number(day) && q.type === type)
      .slice()
      .sort((a, b) => String(a.id).localeCompare(String(b.id)));
    return list;
  }, [questions, day, type]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered.length, pageSize]);

  useEffect(() => {
    setPage((p) => clamp(p, 0, totalPages - 1));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = page * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const countsByType = useMemo(() => {
    const out = {};
    for (const t of TYPES) {
      const list = questions.filter((q) => Number(q.day) === Number(day) && q.type === t);
      const required = list.filter((q) => q.required).length;
      let answeredRequired = 0;
      for (const q of list) {
        if (!q.required) continue;
        if (isAnswered(q, ans[q.id])) answeredRequired++;
      }
      out[t] = { total: list.length, required, answeredRequired };
    }
    return out;
  }, [questions, day, ans]);

  function setAnswer(questionId, payload) {
    setAns((prev) => ({ ...prev, [questionId]: { questionId, ...payload } }));
  }

  const missingRequiredAll = useMemo(() => {
    const missing = [];
    for (const q of questions) {
      if (!q.required) continue;
      if (!isAnswered(q, ans[q.id])) missing.push(q.id);
    }
    return missing;
  }, [questions, ans]);

  async function handleSubmitWeek() {
    setErr("");
    try {
      if (!profileKey.trim()) return setErr("profileKey is required");
      if (missingRequiredAll.length > 0) {
        return setErr(`Missing required: ${missingRequiredAll.slice(0, 20).join(", ")}${missingRequiredAll.length > 20 ? "…" : ""}`);
      }

      setSubmitting(true);
      const answers = Object.values(ans);
      const result = await submitMajor(profileKey.trim(), answers, { bestOfFileKey });

      localStorage.setItem(LS_RESULT, JSON.stringify(result));
      nav("/major-results");
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setSubmitting(false);
    }
  }

  function clearProgress() {
    const key = LS_PROGRESS_PREFIX + profileKey;
    localStorage.removeItem(key);
    setAns({});
    setBestOfFileKey("");
    setPage(0);
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>Loading Major Test…</div>
      </div>
    );
  }

  if (!bank) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.h1}>Major Test</h1>
          <p style={styles.p}>Failed to load bank: {err || "Unknown error"}</p>
        </div>
      </div>
    );
  }

  const dayInfo = scheduleByDay[day];

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.h1}>{bank.title || "Major Test"}</h1>
          <div style={styles.meta}>
            <span><b>Profile:</b></span>
            <input
              value={profileKey}
              onChange={(e) => setProfileKey(e.target.value)}
              style={styles.input}
            />
            <span style={{ opacity: 0.6 }}>•</span>
            <span><b>Version:</b> {bank.version}</span>
            <span style={{ opacity: 0.6 }}>•</span>
            <span><b>ID:</b> {bank.id}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button style={styles.btnGhost} disabled={submitting} onClick={clearProgress}>
            Clear Progress
          </button>
          <button style={styles.btnPrimary} disabled={submitting} onClick={handleSubmitWeek}>
            {submitting ? "Submitting…" : "Submit Week"}
          </button>
        </div>
      </div>

      {err ? <div style={styles.alert}>{err}</div> : null}

      {/* Day tabs */}
      <div style={styles.tabsRow}>
        {asArray(bank?.majorSchedule?.days).map((d) => (
          <button
            key={d.day}
            style={day === d.day ? styles.tabActive : styles.tab}
            onClick={() => {
              setDay(d.day);
              setPage(0);
            }}
          >
            Day {d.day}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={styles.h2}>
              Day {day} — {dayInfo?.title || ""}
            </h2>
            <div style={{ opacity: 0.85 }}>{dayInfo?.notes || ""}</div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ opacity: 0.85 }}>Per page</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              style={styles.select}
            >
              {[5, 10, 15].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Type tabs + progress counts */}
        <div style={{ ...styles.tabsRow, marginTop: 12 }}>
          {TYPES.map((t) => {
            const c = countsByType[t] || { answeredRequired: 0, required: 0, total: 0 };
            const badge = `${c.answeredRequired}/${c.required}`;
            return (
              <button
                key={t}
                style={type === t ? styles.tabActive : styles.tab}
                onClick={() => {
                  setType(t);
                  setPage(0);
                }}
                title={`Required answered: ${badge} (total in type: ${c.total})`}
              >
                {TYPE_LABEL[t]} <span style={styles.badge}>{badge}</span>
              </button>
            );
          })}
        </div>

        {/* Pagination controls */}
        <div style={styles.pagerRow}>
          <button
            style={styles.btnGhost}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page <= 0}
          >
            ← Prev
          </button>

          <div style={{ opacity: 0.9 }}>
            Page <b>{page + 1}</b> / {totalPages}{" "}
            <span style={{ opacity: 0.7 }}>({filtered.length} items)</span>
          </div>

          <button
            style={styles.btnGhost}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next →
          </button>
        </div>

        {/* Questions (paged) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
          {pageItems.map((q) => (
            <QuestionBlock
              key={q.id}
              q={q}
              value={ans[q.id]}
              setAnswer={setAnswer}
              setErr={setErr}
              bestOfFileKey={bestOfFileKey}
              setBestOfFileKey={setBestOfFileKey}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// --------------------
// Question renderer
// --------------------
function QuestionBlock({ q, value, setAnswer, setErr, bestOfFileKey, setBestOfFileKey }) {
  const requiredMark = q.required ? " *" : "";
  const answered = isAnswered(q, value);

  return (
    <div style={styles.qWrap}>
      <div style={styles.qTop}>
        <div style={styles.qTitle}>
          {q.id} — {q.category || q.type}{requiredMark}
        </div>
        <div style={answered ? styles.chipOk : styles.chipNo}>{answered ? "Done" : "Missing"}</div>
      </div>

      <div style={styles.qPrompt}>{q.prompt}</div>

      {q.type === "single" ? (
        <div style={styles.opts}>
          {asArray(q.options).map((o) => (
            <label key={o.id} style={styles.optRow}>
              <input
                type="radio"
                name={q.id}
                checked={Number(value?.optionId) === o.id}
                onChange={() => setAnswer(q.id, { optionId: o.id })}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      ) : null}

      {q.type === "multi" ? (
        <div style={styles.opts}>
          {asArray(q.options).map((o) => {
            const picked = Array.isArray(value?.optionIds) ? value.optionIds : [];
            const isOn = picked.includes(o.id);
            const maxPicks = Number(q.maxPicks || 99);

            return (
              <label key={o.id} style={styles.optRow}>
                <input
                  type="checkbox"
                  checked={isOn}
                  onChange={() => {
                    let next = picked.slice();
                    if (isOn) next = next.filter((x) => x !== o.id);
                    else {
                      if (next.length >= maxPicks) return;
                      next.push(o.id);
                    }
                    setAnswer(q.id, { optionIds: next });
                  }}
                />
                <span>{o.label}</span>
              </label>
            );
          })}
          {q.maxPicks ? <div style={styles.note}>Max picks: {q.maxPicks}</div> : null}
        </div>
      ) : null}

      {q.type === "scale" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            type="range"
            min={q.scale?.min ?? 1}
            max={q.scale?.max ?? 7}
            step={1}
            value={Number.isFinite(Number(value?.value)) ? value.value : q.scale?.neutral ?? 4}
            onChange={(e) => setAnswer(q.id, { value: Number(e.target.value) })}
          />
          <div style={{ opacity: 0.85 }}>
            Value: <b>{Number.isFinite(Number(value?.value)) ? value.value : q.scale?.neutral ?? 4}</b>
          </div>
        </div>
      ) : null}

      {q.type === "rank" ? (
        <RankBlock q={q} value={value} setAnswer={setAnswer} />
      ) : null}

      {q.type === "check" ? (
        <label style={styles.optRow}>
          <input
            type="checkbox"
            checked={value?.completed === true}
            onChange={(e) => setAnswer(q.id, { completed: e.target.checked })}
          />
          <span>Mark complete</span>
        </label>
      ) : null}

      {q.type === "text" ? (
        <textarea
          style={styles.textarea}
          value={value?.text || ""}
          onChange={(e) => setAnswer(q.id, { text: e.target.value })}
          placeholder="Write here…"
          rows={4}
        />
      ) : null}

      {q.type === "file" ? (
        <FileBlock
          q={q}
          value={value}
          setAnswer={setAnswer}
          setErr={setErr}
          bestOfFileKey={bestOfFileKey}
          setBestOfFileKey={setBestOfFileKey}
        />
      ) : null}

      {q.notes ? <div style={styles.note}>{q.notes}</div> : null}
    </div>
  );
}

function RankBlock({ q, value, setAnswer }) {
  const items = asArray(q.items);
  const n = items.length;

  const [order, setOrder] = useState(() => {
    const v = value?.value;
    if (Array.isArray(v) && v.length === n) return v;
    return items.map((i) => i.id);
  });

  useEffect(() => {
    const v = value?.value;
    if (Array.isArray(v) && v.length === n) setOrder(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id]);

  useEffect(() => {
    if (!Array.isArray(value?.value) || value.value.length !== n) {
      setAnswer(q.id, { value: order });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function move(id, dir) {
    const idx = order.indexOf(id);
    if (idx < 0) return;
    const nextIdx = clamp(idx + dir, 0, order.length - 1);
    if (nextIdx === idx) return;

    const next = order.slice();
    next.splice(idx, 1);
    next.splice(nextIdx, 0, id);
    setOrder(next);
    setAnswer(q.id, { value: next });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={styles.note}>Top = rank 1, bottom = rank {n}</div>

      {order.map((id, idx) => {
        const it = items.find((x) => x.id === id);
        if (!it) return null;
        return (
          <div key={id} style={styles.rankRow}>
            <div style={{ fontWeight: 800, width: 64 }}>#{idx + 1}</div>
            <div style={{ flex: 1 }}>{it.label}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={styles.btnMini} onClick={() => move(id, -1)} disabled={idx === 0}>↑</button>
              <button style={styles.btnMini} onClick={() => move(id, 1)} disabled={idx === order.length - 1}>↓</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FileBlock({ q, value, setAnswer, setErr, bestOfFileKey, setBestOfFileKey }) {
  const [uploading, setUploading] = useState(false);
  const fileKey = value?.fileKey || "";
  const previewUrl = fileKey ? `/uploads/${encodeURIComponent(fileKey)}` : "";

  async function onPick(file) {
    setErr("");
    if (!file) return;
    try {
      setUploading(true);
      const out = await uploadFile(file);
      setAnswer(q.id, { fileKey: out.fileKey });
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setUploading(false);
    }
  }

  const isBest = fileKey && bestOfFileKey === fileKey;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input
        type="file"
        accept={asArray(q.accept).join(",")}
        onChange={(e) => onPick(e.target.files?.[0])}
        disabled={uploading}
      />

      {uploading ? <div style={styles.note}>Uploading…</div> : null}

      {fileKey ? (
        <div style={styles.fileRow}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={styles.note}><b>Saved:</b> {fileKey}</div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href={previewUrl} target="_blank" rel="noreferrer" style={styles.link}>
                Open upload
              </a>

              <button
                type="button"
                style={isBest ? styles.btnPrimarySmall : styles.btnGhostSmall}
                onClick={() => setBestOfFileKey(isBest ? "" : fileKey)}
              >
                {isBest ? "Best-Of Selected" : "Mark as Best-Of"}
              </button>
            </div>
          </div>

          <div style={styles.thumb}>
            {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
            <img src={previewUrl} alt="upload preview" style={styles.img} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

// --------------------
// Answer completeness
// --------------------
function isAnswered(q, a) {
  if (!q?.required) return true;
  if (!a) return false;

  if (q.type === "single") return Number.isFinite(Number(a.optionId));
  if (q.type === "multi") return Array.isArray(a.optionIds) && a.optionIds.length > 0;
  if (q.type === "scale") return Number.isFinite(Number(a.value));
  if (q.type === "rank") return Array.isArray(a.value) && a.value.length === (q.items?.length || 0);
  if (q.type === "check") return a.completed === true;
  if (q.type === "text") return typeof a.text === "string" && a.text.trim().length > 0;
  if (q.type === "file") return typeof a.fileKey === "string" && a.fileKey.trim().length > 0;

  return true;
}

function asArray(v) {
  return Array.isArray(v) ? v : [];
}

// --------------------
// Styles
// --------------------
const styles = {
  page: {
    padding: "28px 18px 70px",
    maxWidth: 1150,
    margin: "0 auto",
    color: "rgba(255,255,255,0.92)",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  h1: { fontSize: 28, margin: 0, letterSpacing: 0.2 },
  h2: { fontSize: 18, margin: 0, letterSpacing: 0.2 },
  p: { margin: 0, opacity: 0.9, lineHeight: 1.45 },
  meta: { display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap", opacity: 0.9 },
  input: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "rgba(255,255,255,0.92)",
    borderRadius: 10,
    padding: "8px 10px",
    minWidth: 180,
    outline: "none",
  },
  select: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "rgba(255,255,255,0.92)",
    borderRadius: 10,
    padding: "8px 10px",
    outline: "none",
  },
  alert: {
    marginBottom: 12,
    background: "rgba(255,80,80,0.10)",
    border: "1px solid rgba(255,80,80,0.25)",
    padding: 12,
    borderRadius: 14,
  },
  card: {
    background: "rgba(0,0,0,0.28)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
    marginBottom: 14,
  },
  tabsRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 },
  tab: {
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.90)",
    cursor: "pointer",
    fontWeight: 800,
  },
  tabActive: {
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.14)",
    color: "rgba(255,255,255,0.96)",
    cursor: "pointer",
    fontWeight: 900,
  },
  badge: {
    marginLeft: 6,
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(0,0,0,0.18)",
    fontSize: 12,
    opacity: 0.95,
  },
  pagerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 10,
  },
  qWrap: {
    padding: 14,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
  },
  qTop: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" },
  qTitle: { fontWeight: 900, letterSpacing: 0.2 },
  qPrompt: { marginTop: 6, opacity: 0.92, lineHeight: 1.45 },
  opts: { marginTop: 10, display: "flex", flexDirection: "column", gap: 8 },
  optRow: { display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" },
  note: { marginTop: 8, opacity: 0.75, fontSize: 13, lineHeight: 1.4 },
  textarea: {
    marginTop: 10,
    width: "100%",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    padding: 12,
    outline: "none",
    resize: "vertical",
  },
  rankRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: "10px 10px",
    borderRadius: 12,
    background: "rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.10)",
  },
  btnMini: {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.92)",
    cursor: "pointer",
    fontWeight: 900,
  },
  chipOk: {
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(120,255,160,0.25)",
    background: "rgba(120,255,160,0.10)",
    fontSize: 12,
    fontWeight: 900,
  },
  chipNo: {
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,120,120,0.25)",
    background: "rgba(255,120,120,0.10)",
    fontSize: 12,
    fontWeight: 900,
  },
  fileRow: {
    display: "flex",
    gap: 12,
    justifyContent: "space-between",
    alignItems: "stretch",
    flexWrap: "wrap",
    marginTop: 10,
  },
  thumb: {
    width: 120,
    height: 120,
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.22)",
  },
  img: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  link: { color: "rgba(255,255,255,0.92)", textDecoration: "underline", fontWeight: 800 },
  btnPrimary: {
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.18)",
    border: "1px solid rgba(255,255,255,0.22)",
    color: "rgba(255,255,255,0.95)",
    fontWeight: 900,
    cursor: "pointer",
  },
  btnGhost: {
    padding: "10px 12px",
    borderRadius: 12,
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "rgba(255,255,255,0.9)",
    fontWeight: 900,
    cursor: "pointer",
  },
  btnPrimarySmall: {
    padding: "8px 10px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.18)",
    border: "1px solid rgba(255,255,255,0.22)",
    color: "rgba(255,255,255,0.95)",
    fontWeight: 900,
    cursor: "pointer",
  },
  btnGhostSmall: {
    padding: "8px 10px",
    borderRadius: 12,
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "rgba(255,255,255,0.9)",
    fontWeight: 900,
    cursor: "pointer",
  },
};
