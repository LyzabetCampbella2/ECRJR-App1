import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// Ensure uploads folder exists
const UPLOAD_DIR = path.resolve("uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer storage (keeps original extension)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safeExt = ext.slice(0, 12);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 80 * 1024 * 1024, // 80MB per file (adjust as needed)
  },
});

/**
 * POST /api/uploads
 * multipart/form-data:
 *  - fields: testId, questionId
 *  - files: "files" (array)
 *
 * Returns: { success:true, urls:[...], files:[...] }
 */
router.post("/", upload.array("files", 10), async (req, res) => {
  try {
    const { testId, questionId } = req.body;

    if (!testId || !questionId) {
      return res.status(400).json({
        success: false,
        message: "testId and questionId are required",
      });
    }

    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: "No files received",
      });
    }

    // URLs your frontend can store
    const urls = files.map((f) => `/uploads/${f.filename}`);

    return res.json({
      success: true,
      testId,
      questionId,
      urls,
      files: files.map((f) => ({
        originalname: f.originalname,
        filename: f.filename,
        mimetype: f.mimetype,
        size: f.size,
      })),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Upload failed",
      error: err.message,
    });
  }
});

export default router;
