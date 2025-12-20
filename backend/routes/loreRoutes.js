// backend/routes/loreRoutes.js
import express from "express";
import { getLumiShadowCatalog, getLumiShadowById } from "../controllers/loreDbController.js";

const router = express.Router();

router.get("/lumi-shadow", getLumiShadowCatalog);
router.get("/lumi-shadow/:id", getLumiShadowById);

export default router;
