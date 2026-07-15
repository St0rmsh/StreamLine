import { Router } from "express";
import upload from "../middleware/upload.middleware.js";
import {
    videoUpload,
    getAllVideos,
    getVideo,
    getMyVideos,
    deleteVideo,
    searchVideos,
    updateVideo,
    getTrendingVideos
} from "../controllers/video.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { optionalAuth } from "../middleware/optionalAuth.middleware.js";
import { addView } from "../controllers/view.controller.js";
import { updateWatchTime, getWatchTime } from "../controllers/watch.controller.js";

const router = Router()

// /api/video/me
// GET
router.get("/me", authMiddleware, getMyVideos);

// /api/video/upload
// POST
router.post("/upload", authMiddleware, upload.fields([{ name: "video", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }]), videoUpload);

// /api/video/trending
// GET
router.get("/trending", optionalAuth, getTrendingVideos);

// /api/video/search?q=...
// GET
router.get("/search", optionalAuth, searchVideos);

// /api/video
// GET
router.get("/", optionalAuth, getAllVideos);

// /api/video/:id
// PATCH
router.patch("/:id", authMiddleware, upload.single("thumbnail"), updateVideo);

// /api/video/:id
// DELETE
router.delete("/:id", authMiddleware, deleteVideo);

// /api/video/:videoId/view
// POST
router.post("/:videoId/view", authMiddleware, addView);

// /api/video/:videoId/watch
// POST
router.post("/:videoId/watch", authMiddleware, updateWatchTime);

// /api/video/:videoId/watch
// GET
router.get("/:videoId/watch", authMiddleware, getWatchTime);

// /api/video/:id
// GET
router.get("/:id", optionalAuth, getVideo);

export default router