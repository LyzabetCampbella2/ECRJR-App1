// backend/routes/magicRoutes.js
import express from "express";
import {
  getMagicLibrary,
  getMagicWorlds,
  getMagicPacks,
  expandMagic,
} from "../controllers/magicController.js";

const router = express.Router();

// GET /api/magic/library?includeAbilities=true
router.get("/library", getMagicLibrary);

// GET /api/magic/worlds
router.get("/worlds", getMagicWorlds);

// GET /api/magic/packs?includeAbilities=true
router.get("/packs", getMagicPacks);

// POST /api/magic/expand
router.post("/expand", expandMagic);

export default router;
