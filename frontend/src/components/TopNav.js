import React from "react";
import { Link, useLocation } from "react-router-dom";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/archetypes", label: "Archetypes" },
  { to: "/archetype-lore", label: "Lore Index" },
  { to: "/tests", label: "Tests" },
  { to: "/mini", label: "Mini Tests" },
  { to: "/constellation", label: "Constellation" }
];

export default function TopNav() {
  const { pathname } = useLocation();

  return (
    <div className="navbar">
      {LINKS.map((l) => {
        const active = pathname === l.to || pathname.startsWith(l.to + "/");
        return (
          <Link
            key={l.to}
            className={`btn ${active ? "btn--primary" : ""}`}
            to={l.to}
          >
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}
