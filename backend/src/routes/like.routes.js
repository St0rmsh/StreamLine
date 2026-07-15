import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
    toggleReaction,
    getUserReaction
} from "../controllers/like.controller.js";

const router = Router();

// /api/like/:videoId/react
// POST
router.post("/:videoId/react", authMiddleware, toggleReaction);

// /api/like/:videoId/me
// GET
router.get("/:videoId/me", authMiddleware, getUserReaction);

export default router;