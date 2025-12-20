import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./NavBar.css";

export default function NavBar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="nav">
      <Link
        to="/dashboard"
        className={`navBtn ${isActive("/dashboard") ? "active" : ""}`}
      >
        Dashboard
      </Link>

      <Link
        to="/catalog"
        className={`navBtn ${isActive("/catalog") ? "active" : ""}`}
      >
        Archetypes
      </Link>

      <Link
        to="/lore"
        className={`navBtn ${isActive("/lore") ? "active" : ""}`}
      >
        Lore
      </Link>
    </nav>
  );
}
