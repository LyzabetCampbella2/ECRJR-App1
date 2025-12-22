// backend/routes/pilotCodeRoutes.js
import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// persists codes here:
const DATA_PATH = path.join(__dirname, "..", "data", "pilotCodes.json");

// simple admin key (set in your backend .env):
// ADMIN_KEY=your-secret
const ADMIN_KEY = process.env.ADMIN_KEY || "dev-admin-key";

function ensureStore() {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify({ codes: [] }, null, 2), "utf-8");
  }
}

function loadStore() {
  ensureStore();
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.codes)) return { codes: [] };
    return data;
  } catch {
    return { codes: [] };
  }
}

function saveStore(store) {
  ensureStore();
  fs.writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), "utf-8");
}

function requireAdmin(req, res, next) {
  const key = req.headers["x-admin-key"] || req.query.adminKey || "";
  if (String(key) !== String(ADMIN_KEY)) {
    return res.status(401).json({ ok: false, message: "Unauthorized (admin key missing/invalid)" });
  }
  next();
}

function makeCode(prefix = "EIRDEN") {
  // EIRDEN-XXXXXX-XXXX
  const a = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 chars
  const b = crypto.randomBytes(2).toString("hex").toUpperCase(); // 4 chars
  return `${prefix}-${a}-${b}`;
}

function nowMs() {
  return Date.now();
}

router.get("/health", (req, res) => {
  return res.json({ ok: true, route: "pilot-codes" });
});

// ADMIN: list codes (redact nothing; this is admin)
router.get("/list", requireAdmin, (req, res) => {
  const store = loadStore();
  // newest first
  const codes = [...store.codes].sort((x, y) => (y.createdAt || 0) - (x.createdAt || 0));
  return res.json({ ok: true, data: codes });
});

// ADMIN: generate
router.post("/generate", requireAdmin, (req, res) => {
  const store = loadStore();

  const {
    prefix = "EIRDEN",
    label = "",
    maxUses = 1,                 // 1 = single-use
    expiresInDays = 30,          // default 30 days
  } = req.body || {};

  const code = makeCode(prefix);

  const expiresAt =
    Number(expiresInDays) > 0 ? nowMs() + Number(expiresInDays) * 24 * 60 * 60 * 1000 : null;

  const entry = {
    code,
    label: String(label || ""),
    maxUses: Math.max(1, Number(maxUses) || 1),
    uses: 0,
    isRevoked: false,
    createdAt: nowMs(),
    expiresAt,
    lastUsedAt: null,
  };

  store.codes.push(entry);
  saveStore(store);

  return res.json({ ok: true, data: entry });
});

// ADMIN: revoke a code
router.post("/revoke", requireAdmin, (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ ok: false, message: "code required" });

  const store = loadStore();
  const idx = store.codes.findIndex((c) => c.code === code);
  if (idx === -1) return res.status(404).json({ ok: false, message: "code not found" });

  store.codes[idx].isRevoked = true;
  saveStore(store);

  return res.json({ ok: true, data: store.codes[idx] });
});

// PUBLIC: validate + consume
router.post("/validate", (req, res) => {
  const { code } = req.body || {};
  const trimmed = String(code || "").trim().toUpperCase();
  if (!trimmed) return res.status(400).json({ ok: false, message: "code required" });

  const store = loadStore();
  const entry = store.codes.find((c) => String(c.code).toUpperCase() === trimmed);

  if (!entry) return res.status(404).json({ ok: false, message: "Invalid code" });
  if (entry.isRevoked) return res.status(403).json({ ok: false, message: "Code revoked" });

  if (entry.expiresAt && nowMs() > entry.expiresAt) {
    return res.status(403).json({ ok: false, message: "Code expired" });
  }

  if (entry.uses >= entry.maxUses) {
    return res.status(403).json({ ok: false, message: "Code already used up" });
  }

  // consume
  entry.uses += 1;
  entry.lastUsedAt = nowMs();
  saveStore(store);

  // return a stable “pilot identity” for your frontend
  const userId = `pilot_${crypto.randomBytes(8).toString("hex")}`;

  return res.json({
    ok: true,
    data: {
      userId,
      remainingUses: entry.maxUses - entry.uses,
      label: entry.label,
      expiresAt: entry.expiresAt,
    },
  });
});

export default router;
