import React from "react";
import "./App.css";
import AppRouter from "./AppRouter";

export default function App() {
  return (
    <div className="app-shell">
      <div className="container">
        <AppRouter />
      </div>
    </div>
  );
}
