// backend/server.js (ESM)

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// -------------------------
// Route imports (ONLY imports here)
// -------------------------
import accessRoutes from "./routes/accessRoutes.js";
import miniTestRoutes from "./routes/miniTestRoutes.js";

// OPTIONAL: add these only if they exist in your project.
// If you don't have them yet, leave them commented out.
// import testRoutes from "./routes/testRoutes.js";
// import constellationRoutes from "./routes/constellationRoutes.js";

// -------------------------
// Create app FIRST
// -------------------------
const app = express();

// -------------------------
// Middleware
// -------------------------
app.use(
  cors({
    origin: true, // allows dev origins; tighten later for production
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Helpful request log in dev
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`➡️  ${req.method} ${req.originalUrl}`);
    next();
  });
}

// -------------------------
// Health checks
// -------------------------
app.get("/", (_req, res) => {
  res.json({ ok: true, name: "eirden-backend", status: "running" });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, status: "healthy" });
});

// -------------------------
// Route mounts (ONLY app.use AFTER app is created)
// -------------------------
console.log("✅ LOADED accessRoutes.js");
app.use("/api/access", accessRoutes);

// Frontend is calling: /api/mini-tests/:miniId
app.use("/api/mini-tests", miniTestRoutes);

// OPTIONAL mounts (uncomment if you have these files)
// app.use("/api/tests", testRoutes);
// app.use("/api/constellation", constellationRoutes);

// -------------------------
// 404 handler (API)
// -------------------------
app.use("/api", (req, res) => {
  res.status(404).json({
    ok: false,
    message: "Route not found",
    method: req.method,
    path: req.originalUrl,
  });
});

// -------------------------
// Global error handler
// -------------------------
app.use((err, _req, res, _next) => {
  console.error("❌ Unhandled server error:", err);
  res.status(500).json({
    ok: false,
    message: "Internal server error",
    error: String(err?.message || err),
  });
});

// -------------------------
// Start server
// -------------------------
const PORT = Number(process.env.PORT || 5000);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
