import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function TestStart() {
  const loc = useLocation();
  const testId = loc?.state?.testId || "archetype_v1";

  // Later you'll route based on testId to the correct test page.
  // For now, just send them back to dashboard so build passes.
  return <Navigate to="/dashboard" replace state={{ testId }} />;
}
