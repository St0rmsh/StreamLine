import express from "express";
import { getStudioStats } from "../controllers/analytics.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// 🔒 All analytics are protected
router.use(authMiddleware);

/**
 * @route   GET /api/analytics/studio
 * @desc    Get aggregated stats for Creator Studio
 * @access  Private
 */
router.get("/studio", getStudioStats);

export default router;