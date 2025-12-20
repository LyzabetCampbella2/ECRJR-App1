import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { apiPost } from "../apiClient";

export default function Consent() {
  const navigate = useNavigate();

  // Storage reads (not hooks)
  const userId = safeGet("userId");

  // ✅ Hooks must be unconditional
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Gate AFTER hooks
  if (!userId) return <Navigate to="/login" replace />;

  async function onContinue() {
    if (!checked) {
      setError("Please confirm consent to continue.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await apiPost("/api/auth/consent", { userId });
      if (!res?.success) throw new Error(res?.message || "Consent failed");

      const consentedAt = res?.user?.consentedAt || new Date().toISOString();
      localStorage.setItem("consentedAt", consentedAt);

      navigate("/dashboard");
    } catch (e) {
      setError(e?.message || "Consent failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.badge}>CONSENT</div>
        <h1 style={styles.h1}>Pilot Participation</h1>

        <p style={styles.pMuted}>
          This app provides a creative/personality-style framework. It is not medical advice, not
          diagnosis, and not treatment.
        </p>

        <div style={styles.box}>
          <ul style={styles.list}>
            <li>Your answers and results are stored to improve the system.</li>
            <li>You can stop at any time.</li>
            <li>Use a code name if you prefer anonymity.</li>
            <li>If you want your data removed, contact the study organizer.</li>
          </ul>
        </div>

        <label style={styles.checkRow}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <span style={{ marginLeft: 10 }}>
            I consent to participate and I understand the above.
          </span>
        </label>

        {error ? <p style={{ ...styles.p, color: "#fca5a5" }}>{error}</p> : null}

        <button style={styles.btnPrimary} disabled={loading} onClick={onContinue}>
          {loading ? "Saving…" : "Continue"}
        </button>

        <button style={styles.btnGhost} onClick={() => navigate("/login")}>
          Back to login
        </button>
      </div>
    </div>
  );
}

function safeGet(k) {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#0b0f14",
    padding: 24,
    color: "#e5e7eb",
  },
  card: {
    width: "min(700px, 100%)",
    background: "#111827",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
  },
  badge: {
    display: "inline-block",
    fontSize: 12,
    letterSpacing: "0.12em",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
    marginBottom: 10,
  },
  h1: { margin: "0 0 10px 0", fontSize: 24 },
  p: { margin: "10px 0 0 0", lineHeight: 1.6 },
  pMuted: { margin: "0 0 10px 0", lineHeight: 1.6, color: "#9ca3af" },
  box: {
    marginTop: 10,
    padding: 14,
    borderRadius: 12,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  list: { margin: 0, paddingLeft: 18, lineHeight: 1.8 },
  checkRow: { display: "flex", alignItems: "center", marginTop: 14 },
  btnPrimary: {
    marginTop: 14,
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "none",
    fontWeight: 900,
    cursor: "pointer",
  },
  btnGhost: {
    marginTop: 10,
    width: "100%",
    padding: 12,
    borderRadius: 12,
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.16)",
    color: "#f9fafb",
    fontWeight: 800,
    cursor: "pointer",
  },
};
