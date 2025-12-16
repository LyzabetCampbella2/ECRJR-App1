import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

// A small lore library you can expand anytime
const LORE_LIBRARY = {
  Creator: {
    title: "Creator",
    tagline: "Raw creation, daring invention, and the will to shape worlds.",
    domains: ["Imagination", "Form", "Aesthetic Will"],
    gifts: ["Originality", "Vision", "Artistic momentum"],
    shadows: ["Perfectionism", "Starting too many things", "Self-judgment"],
    practices: ["Ship small", "Make drafts sacred", "Create on a timer"],
    sigil: "✦"
  },
  Scholar: {
    title: "Scholar",
    tagline: "Depth, precision, and the hunger for truth.",
    domains: ["Study", "Patterning", "Mastery"],
    gifts: ["Clarity", "System-building", "Long-form thinking"],
    shadows: ["Over-analysis", "Delay by research", "Fear of being wrong"],
    practices: ["Explain it simply", "Teach to learn", "Build from first principles"],
    sigil: "⌁"
  },
  Guide: {
    title: "Guide",
    tagline: "Stewardship, mentorship, and calm direction.",
    domains: ["Support", "Frameworks", "Translation"],
    gifts: ["Mentoring", "Empathy", "Practical counsel"],
    shadows: ["Over-giving", "Burnout", "Carrying others’ weight"],
    practices: ["Boundaries", "Ask for help", "Lead with questions"],
    sigil: "☉"
  },
  Nexus: {
    title: "Nexus",
    tagline: "Connection, convergence, and catalytic collaboration.",
    domains: ["Networks", "Momentum", "Synthesis"],
    gifts: ["Linking people", "Creating opportunities", "Strategic blending"],
    shadows: ["Scattered focus", "People-pleasing", "Over-commitment"],
    practices: ["One main thread", "Weekly pruning", "Finish before new"],
    sigil: "⟡"
  },
  Watcher: {
    title: "Watcher",
    tagline: "Witness, insight, and the slow intelligence of observation.",
    domains: ["Perception", "Timing", "Meaning"],
    gifts: ["Deep noticing", "Pattern detection", "Restraint"],
    shadows: ["Isolation", "Hesitation", "Under-sharing"],
    practices: ["Name what you see", "Speak one truth daily", "Join one circle"],
    sigil: "◍"
  },
  Artisan: {
    title: "Artisan",
    tagline: "Craft, refinement, and the devotion to excellence.",
    domains: ["Skill", "Detail", "Polish"],
    gifts: ["Consistency", "Quality", "Taste"],
    shadows: ["Rigidity", "Harsh standards", "Fear of messy drafts"],
    practices: ["Make imperfect reps", "Track iterations", "Let it be 80%"],
    sigil: "⟁"
  },
  Polyglot: {
    title: "Polyglot",
    tagline: "Language as doorway: culture, nuance, and embodied fluency.",
    domains: ["Expression", "Culture", "Translation"],
    gifts: ["Adaptability", "Curiosity", "Communication"],
    shadows: ["Fragmented practice", "Plateaus", "Over-collecting resources"],
    practices: ["One language block/day", "Shadowing", "Weekly speaking"],
    sigil: "⌬"
  }
};

function safeText(x) {
  return typeof x === "string" ? x : "";
}

function getLoreFor(name) {
  // match key by normalized casing
  const key = Object.keys(LORE_LIBRARY).find((k) => k.toLowerCase() === String(name || "").toLowerCase());
  return key ? LORE_LIBRARY[key] : null;
}

export default function ArchetypeLore() {
  const { name } = useParams(); // route: /lore/:name
  const navigate = useNavigate();
  const cardRef = useRef(null);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const lore = useMemo(() => getLoreFor(name), [name]);

  const display = useMemo(() => {
    if (lore) return lore;

    const fallbackName = decodeURIComponent(name || "Unknown");
    // fallback card if not found
    return {
      title: fallbackName,
      tagline: "This archetype is not yet fully written in the Lore Library.",
      domains: ["—"],
      gifts: ["—"],
      shadows: ["—"],
      practices: ["Add it to LORE_LIBRARY in ArchetypeLore.js"],
      sigil: "✧"
    };
  }, [lore, name]);

  useEffect(() => {
    setNotice("");
    setError("");
  }, [name]);

  async function copyShareLink() {
    setNotice("");
    setError("");

    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setNotice("Link copied ✅");
    } catch {
      setError("Could not copy link. You can manually copy the URL from the address bar.");
    }
  }

  // Simple “download card” without extra libraries:
  // Uses SVG serialization of a styled card area.
  function downloadCard() {
    setNotice("");
    setError("");

    try {
      const el = cardRef.current;
      if (!el) throw new Error("Card not found");

      // Build a simple SVG “card snapshot” using text + layout
      // (This is stable & light; you can later upgrade to canvas rendering.)
      const title = safeText(display.title);
      const tagline = safeText(display.tagline);
      const sigil = safeText(display.sigil);

      const domains = (display.domains || []).join(" • ");
      const gifts = (display.gifts || []).join(" • ");
      const shadows = (display.shadows || []).join(" • ");

      const width = 1200;
      const height = 630;

      const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b0f14"/>
      <stop offset="100%" stop-color="#131a22"/>
    </linearGradient>
  </defs>

  <rect width="100%" height="100%" fill="url(#bg)" rx="36" />
  <rect x="40" y="40" width="${width - 80}" height="${height - 80}" fill="rgba(255,255,255,0.05)" rx="28" stroke="rgba(255,255,255,0.12)"/>

  <text x="84" y="140" fill="rgba(255,255,255,0.9)" font-size="58" font-family="Georgia, serif">${escapeXml(
    title
  )}</text>
  <text x="${width - 110}" y="140" fill="rgba(255,255,255,0.65)" font-size="64" font-family="Georgia, serif" text-anchor="end">${escapeXml(
    sigil
  )}</text>

  <text x="84" y="205" fill="rgba(255,255,255,0.75)" font-size="28" font-family="Arial, sans-serif">${escapeXml(
    tagline
  )}</text>

  <text x="84" y="290" fill="rgba(255,255,255,0.8)" font-size="22" font-family="Arial, sans-serif">
    <tspan font-weight="700">Domains:</tspan> ${escapeXml(domains)}
  </text>
  <text x="84" y="340" fill="rgba(255,255,255,0.8)" font-size="22" font-family="Arial, sans-serif">
    <tspan font-weight="700">Gifts:</tspan> ${escapeXml(gifts)}
  </text>
  <text x="84" y="390" fill="rgba(255,255,255,0.8)" font-size="22" font-family="Arial, sans-serif">
    <tspan font-weight="700">Shadows:</tspan> ${escapeXml(shadows)}
  </text>

  <text x="84" y="${height - 110}" fill="rgba(255,255,255,0.55)" font-size="18" font-family="Arial, sans-serif">
    Eirden • Archetype Lore • ${escapeXml(title)}
  </text>
</svg>`.trim();

      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `eirden-archetype-${slugify(title)}.svg`;
      a.click();

      URL.revokeObjectURL(url);
      setNotice("Card downloaded ✅ (SVG)");
    } catch (e) {
      setError(e.message || "Could not download card");
    }
  }

  function escapeXml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&apos;");
  }

  function slugify(str) {
    return String(str || "unknown")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  return (
    <div className="container">
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => navigate(-1)}>← Back</button>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/results">Results</Link>
        <Link to="/constellation">Constellation</Link>
      </div>

      <div style={{ marginTop: 16 }}>
        <h2 style={{ marginBottom: 4 }}>Archetype Lore</h2>
        <p className="muted small">
          This page is shareable. Use “Copy link” or “Download card” for social posting.
        </p>
      </div>

      {notice && (
        <div className="panel mt-md" style={{ borderColor: "#cde8d0" }}>
          <b>✅ {notice}</b>
        </div>
      )}

      {error && (
        <div className="panel mt-md" style={{ borderColor: "#f1b3b3" }}>
          <b style={{ color: "crimson" }}>Error:</b> {error}
        </div>
      )}

      {/* Share actions */}
      <div className="mt-md" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={copyShareLink}>Copy link</button>
        <button onClick={downloadCard}>Download card (SVG)</button>
      </div>

      {/* Main Lore Card */}
      <div
        ref={cardRef}
        className="panel mt-lg"
        style={{
          padding: 18,
          borderRadius: 16,
          background: "rgba(20, 28, 38, 0.55)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>
              {display.title} <span style={{ opacity: 0.6, fontWeight: 400 }}>{display.sigil}</span>
            </h3>
            <p style={{ marginTop: 0, opacity: 0.9 }}>{display.tagline}</p>
          </div>

          <div style={{ minWidth: 220 }}>
            <p className="muted small" style={{ marginBottom: 6 }}>
              Shareable Card Preview
            </p>
            <div
              style={{
                borderRadius: 14,
                padding: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)"
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700 }}>{display.title}</div>
              <div className="muted small" style={{ marginTop: 6 }}>
                {display.tagline}
              </div>
              <div className="muted small" style={{ marginTop: 10 }}>
                <b>Sigil:</b> {display.sigil}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-lg" style={{ display: "grid", gap: 12 }}>
          <LoreBlock title="Domains" items={display.domains} />
          <LoreBlock title="Gifts" items={display.gifts} />
          <LoreBlock title="Shadows" items={display.shadows} />
          <LoreBlock title="Practices" items={display.practices} />
        </div>
      </div>

      {/* Expand lore library link */}
      <div className="mt-lg panel">
        <h3 style={{ marginTop: 0 }}>Add more lore</h3>
        <p className="muted small">
          To expand lore depth, add entries to <b>LORE_LIBRARY</b> in{" "}
          <code>frontend/src/pages/ArchetypeLore.js</code>.
        </p>
      </div>
    </div>
  );
}

function LoreBlock({ title, items }) {
  const list = Array.isArray(items) ? items : ["—"];
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.03)"
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {list.map((x, i) => (
          <li key={`${title}-${i}`} style={{ marginBottom: 6 }}>
            {x}
          </li>
        ))}
      </ul>
    </div>
  );
}
