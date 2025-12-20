import React from "react";
import { Link, useLocation } from "react-router-dom";

function NavItem({ to, label, desc }) {
  return (
    <Link
      to={to}
      style={{
        display: "block",
        padding: "14px 14px",
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.10)",
        background: "rgba(255,255,255,0.85)",
        boxShadow: "0 10px 26px rgba(0,0,0,0.06)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
      {desc ? (
        <div style={{ marginTop: 4, fontSize: 12, opacity: 0.75 }}>{desc}</div>
      ) : null}
    </Link>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginTop: 18 }}>
      <div style={{ fontSize: 12, letterSpacing: 0.5, opacity: 0.7, fontWeight: 700 }}>
        {title.toUpperCase()}
      </div>
      <div style={{ marginTop: 10 }}>{children}</div>
    </section>
  );
}

export default function Dashboard() {
  const location = useLocation();

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(900px 500px at 20% 10%, rgba(37,99,235,0.10), transparent 60%)," +
          "radial-gradient(900px 500px at 80% 0%, rgba(16,185,129,0.10), transparent 60%)," +
          "linear-gradient(180deg, rgba(249,250,251,1), rgba(243,244,246,1))",
        color: "#111827",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          backdropFilter: "blur(10px)",
          background: "rgba(255,255,255,0.70)",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 0.2 }}>
              Eirden Dashboard
            </div>
            <div style={{ fontSize: 12, opacity: 0.65 }}>
              Stabilized • Routes online
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 12, opacity: 0.65 }}>
              Current: <span style={{ fontWeight: 700 }}>{location.pathname}</span>
            </span>
            <Link
              to="/"
              style={{
                fontSize: 12,
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.10)",
                background: "white",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              Home
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 18px 34px" }}>
        {/* Hero */}
        <div
          style={{
            border: "1px solid rgba(0,0,0,0.10)",
            borderRadius: 16,
            background: "rgba(255,255,255,0.88)",
            boxShadow: "0 14px 34px rgba(0,0,0,0.07)",
            padding: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ minWidth: 260 }}>
              <h1 style={{ margin: 0, fontSize: 26, letterSpacing: 0.2 }}>
                Your app is back online.
              </h1>
              <p style={{ margin: "8px 0 0", opacity: 0.75, maxWidth: 720 }}>
                This dashboard is your stable hub. If something breaks later, we
                can always return here and re-enable features in controlled steps.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link
                to="/start"
                style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  borderRadius: 12,
                  textDecoration: "none",
                  background: "#111827",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                Start Main Test
              </Link>

              <Link
                to="/mini"
                style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  borderRadius: 12,
                  textDecoration: "none",
                  background: "rgba(37,99,235,0.12)",
                  border: "1px solid rgba(37,99,235,0.35)",
                  color: "#111827",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                Mini Suite
              </Link>

              <Link
                to="/constellation"
                style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  borderRadius: 12,
                  textDecoration: "none",
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.35)",
                  color: "#111827",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                Constellation
              </Link>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          <div
            style={{
              border: "1px solid rgba(0,0,0,0.10)",
              borderRadius: 16,
              background: "rgba(255,255,255,0.88)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Main Test Flow</div>
            <div style={{ display: "grid", gap: 10 }}>
              <NavItem to="/start" label="Test Start" desc="Begin / resume the main test." />
              <NavItem to="/run" label="Test Runner" desc="Run questions / scoring." />
              <NavItem to="/results" label="Test Results" desc="View results + breakdown." />
            </div>
          </div>

          <div
            style={{
              border: "1px solid rgba(0,0,0,0.10)",
              borderRadius: 16,
              background: "rgba(255,255,255,0.88)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Mini Tests</div>
            <div style={{ display: "grid", gap: 10 }}>
              <NavItem to="/mini" label="Mini Suite" desc="Your mini-test overview hub." />
              <NavItem to="/mini/run" label="Mini Test Runner" desc="Runs mini-test sequences." />
              <NavItem to="/mini/results" label="Mini Results" desc="Mini outcomes + signals." />
              <NavItem to="/mini/shadow" label="Shadow Test" desc="Shadow alignment mini-test." />
              <NavItem to="/mini/artist" label="Artist Test" desc="Creative profile mini-test." />
            </div>
          </div>

          <div
            style={{
              border: "1px solid rgba(0,0,0,0.10)",
              borderRadius: 16,
              background: "rgba(255,255,255,0.88)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Archetypes + Lore</div>
            <div style={{ display: "grid", gap: 10 }}>
              <NavItem to="/archetypes" label="Archetypes" desc="Browse the archetype catalog." />
              <NavItem
                to="/archetypes/arch_001"
                label="Archetype Detail (sample)"
                desc="Direct archetype view via ID."
              />
              <NavItem
                to="/archetypes/constellation"
                label="Archetype Constellation"
                desc="Archetypes mapped into constellation view."
              />
              <NavItem
                to="/lore/luminaries"
                label="Luminary Lore"
                desc="Lore entries for luminaries."
              />
              <NavItem
                to="/lore/shadows"
                label="Shadow Lore"
                desc="Lore entries for shadows."
              />
            </div>
          </div>
        </div>

        <Section title="Utilities">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 14,
            }}
          >
            <NavItem to="/dossier/print" label="Dossier Print" desc="Print/export dossier view." />
            <NavItem to="/archive" label="Archive" desc="Past runs / saved items." />
            <NavItem to="/pilot" label="Pilot Code Generator" desc="Generate pilot/access codes." />
            <NavItem to="/login" label="Login" desc="Access code login screen." />
            <NavItem to="/access" label="Access" desc="Access gate / validation." />
            <NavItem to="/consent" label="Consent" desc="Consent screen / policy acceptance." />
          </div>
        </Section>

        <Section title="Constellation">
          <div
            style={{
              border: "1px solid rgba(0,0,0,0.10)",
              borderRadius: 16,
              background: "rgba(255,255,255,0.88)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
              padding: 16,
            }}
          >
            <div style={{ display: "grid", gap: 10 }}>
              <NavItem to="/constellation" label="Constellation Dashboard" desc="Your overview dashboard." />
              <NavItem to="/constellation/view" label="Constellation View" desc="Alternate constellation page." />
            </div>
          </div>
        </Section>

        <div style={{ marginTop: 18, fontSize: 12, opacity: 0.65 }}>
          Tip: If styles ever look “default” again, check that <b>App.css</b> is
          imported in <b>App.js</b> and that filenames match casing.
        </div>
      </div>
    </div>
  );
}
