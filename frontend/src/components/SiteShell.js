import React from "react";
import TopNav from "../components/TopNav";

export default function SiteShell({ title, subtitle, children, rightSlot }) {
  return (
    <div className="site">
      <header className="site-header">
        <div className="site-header__left">
          <div className="brand">
            <div className="brand__mark">E</div>
            <div className="brand__text">
              <div className="brand__name">Echoryn</div>
              <div className="brand__tag">Creative Raveliquarith Judgment Rhemex</div>
            </div>
          </div>

          <nav className="nav">
            <a className="nav__link" href="/dashboard">Dashboard</a>
            <a className="nav__link" href="/constellation">Constellation</a>
            <a className="nav__link" href="/results">Results</a>
          </nav>
        </div>

        <div className="site-header__right">
          {rightSlot}
        </div>
      </header>

      <main className="site-main">
        <div className="page-head">
          <div>
            {title && <h1 className="page-title">{title}</h1>}
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
        </div>
<a className="nav__link" href="/archive">Archive</a>

        {children}
      </main>

      <footer className="site-footer">
        <div className="muted small">
          Echoryn Archive • Raveliquarith governs interpretation • Seals persist per run
        </div>
      </footer>
    </div>
  );
}
