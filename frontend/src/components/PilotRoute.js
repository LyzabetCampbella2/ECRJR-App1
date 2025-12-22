// src/components/PilotRoute.js
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

function hasPilotAccessStable() {
  try {
    const v = (localStorage.getItem("pilotAccess") || "").toLowerCase();
    return ["true", "1", "yes", "on"].includes(v);
  } catch {
    return false;
  }
}

export default function PilotRoute({ children }) {
  const location = useLocation();
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  // Read ONCE, then decide (prevents flicker loops)
  useEffect(() => {
    setAllowed(hasPilotAccessStable());
    setChecked(true);
  }, []);

  // Don’t redirect until we know
  if (!checked) return null;

  // Prevent redirect loop: if we’re already on /access, don’t Navigate again
  if (!allowed) {
    if (location.pathname.startsWith("/access")) return children;
    return <Navigate to="/access" replace state={{ from: location.pathname }} />;
  }

  return children;
}
