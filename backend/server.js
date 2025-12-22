// backend/server.js (ESM, dependency-safe)

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import "dotenv/config";

// ----------------------------------------------------
// Path helpers
// ----------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------------------------------------
// App
// ----------------------------------------------------
const app = express();

// ----------------------------------------------------
// Middleware (ONLY built-ins + cors)
// ----------------------------------------------------
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ----------------------------------------------------
// Utility: safe route mounting (won't crash if missing)
// ----------------------------------------------------
async function safeMountRoute(label, mountPath, relativeFilePath) {
  const abs = path.join(__dirname, relativeFilePath);

  if (!fs.existsSync(abs)) {
    console.log(`⚠️  SKIP ${label}: missing ${relativeFilePath}`);
    return;
  }

  try {
    const mod = await import(pathToFileURL(abs).href);
    const router = mod?.default;

    if (!router) {
      console.log(`⚠️  SKIP ${label}: no default export`);
      return;
    }

    app.use(mountPath, router);
    console.log(`✅ LOADED ${label} → ${mountPath}`);
  } catch (e) {
    console.log(`❌ FAILED ${label}: ${e.message}`);
  }
}

// ----------------------------------------------------
// Core routes
// ----------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    status: "healthy",
    time: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.send("Backend is running.");
});

// ----------------------------------------------------
// Mount routes
// ----------------------------------------------------
async function mountAllRoutes() {
  // Access / pilot codes
  await safeMountRoute("accessRoutes", "/api/access", "./routes/accessRoutes.js");
  await safeMountRoute("pilotCodeRoutes", "/api/pilot-codes", "./routes/pilotCodeRoutes.js");

  // Lore
  await safeMountRoute("loreRoutes", "/api/lore", "./routes/loreRoutes.js");
  await safeMountRoute("loreEntriesRoutes", "/api/lore", "./routes/loreEntriesRoutes.js");

  // Tests
  await safeMountRoute("testRoutes", "/api/tests", "./routes/testRoutes.js");
  await safeMountRoute("miniTestRoutes", "/api/mini-tests", "./routes/miniTestRoutes.js");

  // Major tests
  await safeMountRoute("majorTestRoutes", "/api/major-test", "./routes/majorTestRoutes.js");
  await safeMountRoute("majorTestRoutesAlt", "/api/major-test", "./routes/majortestRoutes.js");

  // Results
  await safeMountRoute("resultsRoutes", "/api/results", "./routes/resultsRoutes.js");

  // Archetypes / constellation
  await safeMountRoute("archetypeRoutes", "/api/archetypes", "./routes/archetypeRoutes.js");
  await safeMountRoute("archetypeScoringRoutes", "/api/archetype-results", "./routes/archetypeScoringRoutes.js");
  await safeMountRoute("constellationRoutes", "/api/constellation", "./routes/constellationRoutes.js");

  // API fallback
  app.use("/api", (req, res) => {
    res.status(404).json({
      ok: false,
      message: "Route not found",
      method: req.method,
      path: req.path,
    });
  });
}

// ----------------------------------------------------
// Global error handler
// ----------------------------------------------------
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({
    ok: false,
    message: err?.message || "Internal Server Error",
  });
});

// ----------------------------------------------------
// Start server
// ----------------------------------------------------
const PORT = process.env.PORT || 5000;

mountAllRoutes().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Backend listening on http://localhost:${PORT}`);
  });
});
