// src/Layout.js
export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">
          <div className="title">Eirden Atelier</div>
          <div className="subtitle">Modern academia • tests & constellations</div>
        </div>

        <div className="pill-row">
          <div className="pill is-forest">Luminaries</div>
          <div className="pill is-oxblood">Shadows</div>
        </div>
      </div>

      <div className="brass-rule"></div>

      {children}
    </div>
  );
}
