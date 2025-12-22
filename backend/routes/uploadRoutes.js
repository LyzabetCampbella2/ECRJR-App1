// backend/routes/uploadRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function safeName(name) {
  const base = String(name || "file")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 120);
  const stamp = Date.now();
  return `${stamp}_${base}`;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, safeName(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// POST /api/uploads  (field name must be "file")
router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, message: "No file uploaded (field name: file)" });
  }

  const fileKey = req.file.filename; // store this in answers as fileKey
  const url = `/uploads/${encodeURIComponent(fileKey)}`;

  return res.json({
    ok: true,
    fileKey,
    originalName: req.file.originalname,
    size: req.file.size,
    mime: req.file.mimetype,
    url,
  });
});

export default router;
