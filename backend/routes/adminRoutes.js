// backend/routes/adminRoutes.js
import express from "express";

/**
 * Admin routes (stub)
 * Base: /api/admin
 *
 * This exists so server.js can import it without crashing.
 * Expand later with auth + admin tools.
 */

const router = express.Router();

router.get("/ping", (_req, res) => {
  res.json({ ok: true, message: "admin router ok" });
});

router.get("/status", (_req, res) => {
  res.json({
    ok: true,
    status: "admin access stub",
    note: "Replace with real admin logic later",
  });
});

export default router;
