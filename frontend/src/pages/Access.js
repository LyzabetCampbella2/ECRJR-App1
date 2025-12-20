import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { validatePilotCode } from "../apiAccess";
import { setAccess, hasPilotAccess, clearAccess, getAccess } from "../utils/access";

export default function Access() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const current = getAccess();

  const submit = async () => {
    setStatus("");
    const trimmed = code.trim();

    if (!trimmed) {
      setStatus("Enter your pilot tester code.");
      return;
    }

    setLoading(true);
    try {
      const result = await validatePilotCode(trimmed);

      // Store for gating + submissions
      setAccess({
        role: "pilot",
        accessLevel: result.accessLevel || "pilot",
        code: trimmed.toUpperCase(),
        validatedAt: new Date().toISOString(),
      });

      setStatus("✅ Access granted. Redirecting…");
      navigate("/test/start", { replace: true });
    } catch (e) {
      setStatus(`❌ ${e.message || "Invalid code"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.h1}>Pilot Tester Access</h1>
        <p style={styles.sub}>
          Enter your pilot code to unlock the test system.
        </p>

        {hasPilotAccess() ? (
          <div style={styles.okBox}>
            <div style={{ fontWeight: 800 }}>Already unlocked ✅</div>
            <div style={{ opacity: 0.85, marginTop: 6 }}>
              Code: <strong>{current?.code}</strong> · Level: <strong>{current?.accessLevel}</strong>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => navigate("/test/start")}>
                Go to Tests
              </button>
              <button
                style={styles.btn}
                onClick={() => {
                  clearAccess();
                  setStatus("Access cleared.");
                }}
              >
                Clear Access
              </button>
            </div>
          </div>
        ) : (
          <>
            <label style={styles.label}>Pilot code</label>
            <input
              style={styles.input}
              value={code}
              placeholder="EIRDEN-PILOT-XXXX"
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />

            <button
              style={{ ...styles.btn, ...styles.btnPrimary, marginTop: 12 }}
              onClick={submit}
              disabled={loading}
            >
              {loading ? "Validating..." : "Unlock"}
            </button>
          </>
        )}

        {status ? <div style={styles.status}>{status}</div> : null}
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
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
  },
  card: {
    width: "min(700px, 100%)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 22,
    background: "rgba(255,255,255,0.04)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },
  h1: { margin: 0, fontSize: 28 },
  sub: { marginTop: 8, opacity: 0.85, lineHeight: 1.4 },

  label: { display: "block", marginTop: 14, marginBottom: 8, fontSize: 13, opacity: 0.9 },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.25)",
    color: "#e9ecf1",
    outline: "none",
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

  status: {
    marginTop: 14,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    opacity: 0.95,
  },

  okBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(120,255,160,0.18)",
    background: "rgba(120,255,160,0.06)",
  },
};
