// src/pages/Access.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Access() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);

    try {
      const res = await fetch("/api/pilot-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.message || "Invalid code");

      // Unlock app
      localStorage.setItem("pilotAccess", "true");
      localStorage.setItem("userId", json.data.userId);
      localStorage.setItem("pilotLabel", json.data.label || "");
      if (json.data.expiresAt) localStorage.setItem("pilotExpiresAt", String(json.data.expiresAt));

      navigate("/dashboard", { replace: true });
    } catch (e2) {
      setErr(e2?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h2 style={styles.h2}>Access Required</h2>
        <p style={styles.p}>Enter your pilot access code to continue.</p>

        <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="EIRDEN-XXXXXX-XXXX"
            style={styles.input}
            autoComplete="off"
          />

          {err ? <div style={styles.err}>{err}</div> : null}

          <button disabled={busy || !code.trim()} style={styles.btn}>
            {busy ? "Checking…" : "Enter"}
          </button>
        </form>

        <div style={styles.smallRow}>
          <Link to="/login" style={styles.link}>Use Login</Link>
          <span style={{ opacity: 0.5 }}>•</span>
          <Link to="/lore/entries" style={styles.link}>Browse Lore (public)</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  card: { width: "100%", maxWidth: 520, border: "1px solid rgba(0,0,0,.14)", borderRadius: 18, padding: 18, background: "rgba(255,255,255,.85)" },
  h2: { margin: 0 },
  p: { marginTop: 8, opacity: 0.8 },
  input: { width: "100%", padding: "12px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,.18)" },
  btn: { width: "100%", marginTop: 10, padding: "12px 12px", borderRadius: 12, border: "none", background: "#222", color: "#fff", fontWeight: 700, cursor: "pointer" },
  err: { marginTop: 10, color: "#a33", fontSize: 13 },
  smallRow: { display: "flex", gap: 10, marginTop: 12, alignItems: "center", fontSize: 13, opacity: 0.85 },
  link: { color: "inherit" },
};
