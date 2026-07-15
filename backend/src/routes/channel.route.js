import { Router } from "express";
import {
    createChannel,
    getMyChannel,
    getChannelByHandle,
    updateChannel,
    getChannelVideos
} from "../controllers/channel.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { optionalAuth } from "../middleware/optionalAuth.middleware.js";
import { uploadImage } from "../middleware/uploadImage.middleware.js";
const router = Router();


// /api/channel/create
// POST
router.post("/create", authMiddleware, uploadImage.fields([
    { name: "avatar", maxCount: 1 },
    { name: "banner", maxCount: 1 }
]), createChannel);


// /api/channel/me
// GET
router.get("/me", authMiddleware, getMyChannel);


// /api/channel/update
// PUT
router.put("/update", authMiddleware, uploadImage.fields([
    { name: "avatar", maxCount: 1 },
    { name: "banner", maxCount: 1 }
]), updateChannel);


// /api/channel/:handle/videos
// GET
router.get("/:handle/videos", optionalAuth, getChannelVideos);


// /api/channel/:handle
// GET
router.get("/:handle", getChannelByHandle);

export default router;