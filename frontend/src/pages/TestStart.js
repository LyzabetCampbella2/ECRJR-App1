import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TESTS, TEST_LIST } from "../data/tests";

export default function TestStart() {
  const navigate = useNavigate();

  const [selectedTestId, setSelectedTestId] = useState(TEST_LIST[0]?.id || "language_v1");
  const [mode, setMode] = useState("dynamic"); // dynamic => /test/:testId, generic => /test
  const [error, setError] = useState("");

  const selected = useMemo(() => TESTS[selectedTestId], [selectedTestId]);

  const goStart = () => {
    setError("");

    if (!selectedTestId || !TESTS[selectedTestId]) {
      setError("Please select a valid test to start.");
      return;
    }

    if (mode === "dynamic") {
      navigate(`/test/${selectedTestId}`, {
        state: {
          startedFrom: "/test/start",
          testId: selectedTestId,
          startedAt: new Date().toISOString(),
        },
      });
      return;
    }

    navigate("/test", {
      state: {
        startedFrom: "/test/start",
        testId: selectedTestId,
        startedAt: new Date().toISOString(),
      },
    });
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.h1}>Test Start</h1>
            <p style={styles.sub}>Pick a test, then route into the runner.</p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/")}
            style={{ ...styles.btn, ...styles.btnGhost }}
          >
            Home
          </button>
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Select test</label>
          <select
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
            style={styles.select}
          >
            {TEST_LIST.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.id})
              </option>
            ))}
          </select>
        </div>

        {/* ✅ Metadata preview */}
        {selected ? (
          <div style={styles.metaBox}>
            <div style={styles.metaTitle}>{selected.title}</div>
            <div style={styles.metaDesc}>{selected.description}</div>
            <div style={styles.metaRow}>
              <span style={styles.metaPill}>Questions: {selected.totalQuestions}</span>
              <span style={styles.metaPill}>ID: {selected.id}</span>
            </div>
          </div>
        ) : null}

        <div style={styles.section}>
          <label style={styles.label}>Routing mode</label>
          <div style={styles.radioRow}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="mode"
                value="dynamic"
                checked={mode === "dynamic"}
                onChange={() => setMode("dynamic")}
              />
              <span style={styles.radioText}>Dynamic route: /test/:testId (recommended)</span>
            </label>

            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="mode"
                value="generic"
                checked={mode === "generic"}
                onChange={() => setMode("generic")}
              />
              <span style={styles.radioText}>Generic route: /test (uses location.state)</span>
            </label>
          </div>
        </div>

        {error ? <div style={styles.error}>{error}</div> : null}

        <div style={styles.footerRow}>
          <div style={styles.preview}>
            <div style={styles.previewLabel}>Preview</div>
            <div style={styles.previewValue}>
              {mode === "dynamic" ? `/test/${selectedTestId}` : "/test"}
            </div>
          </div>

          <button type="button" onClick={goStart} style={{ ...styles.btn, ...styles.btnPrimary }}>
            Start
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    background: "#0b0f1a",
    color: "#e9ecf1",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  },
  card: {
    width: "min(860px, 100%)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 22,
    background: "rgba(255,255,255,0.04)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },
  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 18,
  },
  h1: { margin: 0, fontSize: 28, letterSpacing: 0.2 },
  sub: { margin: "6px 0 0 0", opacity: 0.8, lineHeight: 1.35 },

  section: { marginTop: 16 },
  label: { display: "block", marginBottom: 8, fontSize: 13, opacity: 0.9 },
  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.25)",
    color: "#e9ecf1",
    outline: "none",
  },

  metaBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
  },
  metaTitle: { fontSize: 16, fontWeight: 700, marginBottom: 6 },
  metaDesc: { fontSize: 13, opacity: 0.85, lineHeight: 1.45, marginBottom: 10 },
  metaRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  metaPill: {
    fontSize: 12,
    opacity: 0.9,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.18)",
  },

  radioRow: { display: "grid", gap: 10 },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
  },
  radioText: { opacity: 0.95, fontSize: 14 },

  error: {
    marginTop: 14,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,80,80,0.35)",
    background: "rgba(255,80,80,0.12)",
    color: "#ffd7d7",
  },

  footerRow: {
    marginTop: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  preview: { display: "grid", gap: 4 },
  previewLabel: { fontSize: 12, opacity: 0.75 },
  previewValue: { fontSize: 14, opacity: 0.95 },

  btn: {
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#e9ecf1",
    borderRadius: 12,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 600,
  },
  btnPrimary: {
    background: "rgba(120,140,255,0.25)",
    border: "1px solid rgba(120,140,255,0.40)",
  },
  btnGhost: { background: "transparent" },
};
