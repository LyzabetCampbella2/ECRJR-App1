// src/pages/PilotCodeGen.js
import React, { useEffect, useState } from "react";

export default function PilotCodeGen() {
  const [adminKey, setAdminKey] = useState(localStorage.getItem("adminKey") || "");
  const [prefix, setPrefix] = useState("EIRDEN");
  const [label, setLabel] = useState("Pilot");
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState(30);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [codes, setCodes] = useState([]);
  const [lastMade, setLastMade] = useState(null);

  async function loadList(key = adminKey) {
    setErr("");
    try {
      const res = await fetch(`/api/pilot-codes/list?adminKey=${encodeURIComponent(key)}`);
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.message || "Failed to load list");
      setCodes(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setErr(e?.message || "Failed");
    }
  }

  useEffect(() => {
    if (adminKey) loadList(adminKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerate() {
    setBusy(true);
    setErr("");
    setLastMade(null);
    try {
      localStorage.setItem("adminKey", adminKey);

      const res = await fetch("/api/pilot-codes/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ prefix, label, maxUses: Number(maxUses), expiresInDays: Number(expiresInDays) }),
      });

      const json = await res.json();
      if (!json?.ok) throw new Error(json?.message || "Generate failed");

      setLastMade(json.data);
      await loadList(adminKey);
    } catch (e) {
      setErr(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(code) {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/pilot-codes/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.message || "Revoke failed");
      await loadList(adminKey);
    } catch (e) {
      setErr(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  function copy(text) {
    try {
      navigator.clipboard.writeText(text);
    } catch {}
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h2 style={{ margin: 0 }}>Pilot Code Generator (Admin)</h2>
        <p style={{ opacity: 0.75, marginTop: 8 }}>
          Generates access codes stored on the backend. Requires ADMIN_KEY.
        </p>

        <div style={styles.row}>
          <label style={styles.label}>Admin Key</label>
          <input value={adminKey} onChange={(e) => setAdminKey(e.target.value)} style={styles.input} placeholder="ADMIN_KEY" />
        </div>

        <div style={styles.grid2}>
          <div>
            <label style={styles.label}>Prefix</label>
            <input value={prefix} onChange={(e) => setPrefix(e.target.value)} style={styles.input} />
          </div>
          <div>
            <label style={styles.label}>Label</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} style={styles.input} />
          </div>
          <div>
            <label style={styles.label}>Max Uses</label>
            <input type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} style={styles.input} />
          </div>
          <div>
            <label style={styles.label}>Expires (days)</label>
            <input type="number" min="1" value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)} style={styles.input} />
          </div>
        </div>

        {err ? <div style={styles.err}>{err}</div> : null}

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button disabled={busy || !adminKey} onClick={handleGenerate} style={styles.btnPrimary}>
            {busy ? "Working…" : "Generate Code"}
          </button>
          <button disabled={busy || !adminKey} onClick={() => loadList(adminKey)} style={styles.btnGhost}>
            Refresh List
          </button>
        </div>

        {lastMade ? (
          <div style={styles.last}>
            <div style={{ fontWeight: 800 }}>New Code:</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
              <code style={styles.code}>{lastMade.code}</code>
              <button onClick={() => copy(lastMade.code)} style={styles.btnSmall}>Copy</button>
            </div>
            <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
              Uses: {lastMade.uses}/{lastMade.maxUses} • Expires: {lastMade.expiresAt ? new Date(lastMade.expiresAt).toLocaleString() : "Never"}
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: 16 }}>
          <h3 style={{ margin: "10px 0" }}>Existing Codes</h3>
          <div style={styles.list}>
            {codes.map((c) => (
              <div key={c.code} style={styles.item}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 750 }}>{c.code}</div>
                  <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
                    {c.label || "—"} • uses {c.uses}/{c.maxUses} • {c.isRevoked ? "REVOKED" : "ACTIVE"} •{" "}
                    {c.expiresAt ? `expires ${new Date(c.expiresAt).toLocaleString()}` : "no expiry"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => copy(c.code)} style={styles.btnSmall}>Copy</button>
                  <button disabled={busy || c.isRevoked} onClick={() => revoke(c.code)} style={styles.btnSmallDanger}>
                    Revoke
                  </button>
                </div>
              </div>
            ))}
            {codes.length === 0 ? <div style={{ opacity: 0.7 }}>No codes found.</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 980, margin: "0 auto", padding: 18 },
  card: { border: "1px solid rgba(0,0,0,.14)", borderRadius: 18, padding: 16, background: "rgba(255,255,255,.85)" },
  row: { marginTop: 10 },
  grid2: { marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 },
  label: { display: "block", fontSize: 12, opacity: 0.7, marginBottom: 6 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,.18)" },
  err: { marginTop: 10, color: "#a33" },
  btnPrimary: { padding: "12px 14px", borderRadius: 12, border: "none", background: "#222", color: "#fff", fontWeight: 800, cursor: "pointer" },
  btnGhost: { padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(0,0,0,.18)", background: "transparent", cursor: "pointer" },
  last: { marginTop: 14, padding: 12, borderRadius: 14, background: "rgba(0,0,0,.04)" },
  code: { padding: "6px 10px", borderRadius: 10, background: "rgba(0,0,0,.06)" },
  btnSmall: { padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(0,0,0,.18)", background: "white", cursor: "pointer" },
  btnSmallDanger: { padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(160,0,0,.25)", background: "rgba(160,0,0,.06)", cursor: "pointer" },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  item: { display: "flex", gap: 10, alignItems: "center", padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,.10)" },
};
