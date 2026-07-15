import { Router } from "express";
import {
    addComment,
    getComments,
    deleteComment,
    reactToComment
} from "../controllers/comment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// /api/comment/:videoId/comment
// POST
router.post("/:videoId/comment", authMiddleware, addComment);

// /api/comment/:commentId/react
// POST
router.post("/:commentId/react", authMiddleware, reactToComment);

// /api/comment/:commentId
// DELETE
router.delete("/:commentId", authMiddleware, deleteComment);

// /api/comment/:videoId
// GET
router.get("/:videoId", getComments);

export default router;