import React from "react";
import { createRoot } from "react-dom/client";
import AppRouter from "./AppRouter";

// Optional global styles (safe if it exists)
import "./index.css";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
