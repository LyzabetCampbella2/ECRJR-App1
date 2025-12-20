import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../apiClient";

export default function AccessCodeLogin() {
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiPost("/api/auth/code", { accessCode });
      if (!data?.success) throw new Error(data?.message || "Login failed");

      const user = data.user;
      localStorage.setItem("userId", user.userId);
      localStorage.setItem("accessCode", user.accessCode);

      // If you want consent gating later, route there first.
      navigate("/dashboard");
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b0f14", color: "#e5e7eb", padding: 24 }}>
      <form onSubmit={onSubmit} style={{ width: "min(520px, 100%)", background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Enter Access Code</h1>
        <p style={{ marginTop: 8, color: "#9ca3af" }}>
          Pilot testers: use the code you were given.
        </p>

        <input
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          placeholder="e.g. EIRDEN-TEST-01"
          style={{ width: "100%", marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#f9fafb" }}
        />

        {error ? <p style={{ marginTop: 10, color: "#fca5a5" }}>{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: 14, width: "100%", padding: 12, borderRadius: 12, border: "none", fontWeight: 800, cursor: "pointer" }}
        >
          {loading ? "Checking…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
