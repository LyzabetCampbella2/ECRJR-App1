// src/pages/Consent.js
import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

export default function Consent() {
  const navigate = useNavigate();

  const [checked, setChecked] = useState(false);
  const [userId, setUserId] = useState(null);
  const [consented, setConsented] = useState(false);

  // Read auth + consent ONCE (prevents flicker)
  useEffect(() => {
    try {
      const uid = localStorage.getItem("userId");
      const consentFlag = localStorage.getItem("consentAccepted");

      setUserId(uid || null);
      setConsented(consentFlag === "true");
    } catch {
      setUserId(null);
      setConsented(false);
    } finally {
      setChecked(true);
    }
  }, []);

  // ⛔️ IMPORTANT: do nothing until checked
  if (!checked) {
    return null; // or a spinner if you want
  }

  // 🚪 Not logged in → go to login ONCE
  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Already consented → dashboard
  if (consented) {
    return <Navigate to="/dashboard" replace />;
  }

  // --- UI ---
  function handleAccept() {
    try {
      localStorage.setItem("consentAccepted", "true");
    } catch {}
    navigate("/dashboard", { replace: true });
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h2 style={styles.h2}>Consent & Participation</h2>

        <p style={styles.p}>
          Before continuing, please confirm that you understand and accept the
          participation terms for this system.
        </p>

        <ul style={styles.list}>
          <li>Your responses may be analyzed to generate results</li>
          <li>No medical, legal, or diagnostic claims are made</li>
          <li>You may exit or reset your data at any time</li>
        </ul>

        <button style={styles.btnPrimary} onClick={handleAccept}>
          I Understand & Agree
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    maxWidth: 520,
    width: "100%",
    padding: 24,
    borderRadius: 20,
    border: "1px solid rgba(0,0,0,.15)",
    background: "rgba(255,255,255,.85)",
  },
  h2: {
    marginTop: 0,
    marginBottom: 12,
  },
  p: {
    lineHeight: 1.6,
    opacity: 0.9,
  },
  list: {
    marginTop: 12,
    marginBottom: 20,
    paddingLeft: 18,
    opacity: 0.85,
  },
  btnPrimary: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 15,
    background: "#222",
    color: "#fff",
  },
};
