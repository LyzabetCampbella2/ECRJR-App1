import React from "react";
import { Navigate } from "react-router-dom";
import { hasPilotAccess } from "../utils/access";
import TopNav from "../components/TopNav";

export default function PilotRoute({ children }) {
  if (!hasPilotAccess()) return <Navigate to="/access" replace />;
  return children;
}
