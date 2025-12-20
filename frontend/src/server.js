/**
 * EIRDEN BACKEND SERVER
 * Stable rebuild version
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

/* =========================
   APP INIT
   ========================= */

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   MIDDLEWARE
   ========================= */

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================
   HEALTH CHECK (DEPLOYMENT)
   ========================= */

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "eirden-backend",
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString()
  });
});

/* =========================
   ROUTES
   ========================= */

const testRoutes = require("./routes/testRoutes");

// API namespace
app.use("/api/tests", testRoutes);

/* =========================
   FALLBACKS
   ========================= */

// Root
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Eirden backend running"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl
  });
});

/* =========================
   SERVER START
   ========================= */

app.listen(PORT, () => {
  console.log(`🚀 Eirden backend running on port ${PORT}`);
  console.log(`🌱 Environment: ${process.env.NODE_ENV || "development"}`);
});
