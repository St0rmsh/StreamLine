import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
    toggleSubscribe,
    getSubscribersCount,
    getUserSubscriptions,
    getChannelSubscribers,
    isSubscribed,
    getSubscriptionsFeed
} from "../controllers/subscriber.controller.js";

const router = Router();

// /api/subscription/me
// GET
router.get("/me", authMiddleware, getUserSubscriptions);

// /api/subscription/:channelId/toggle
// POST
router.post("/:channelId/toggle", authMiddleware, toggleSubscribe);

// /api/subscription/:channelId/count
// GET
router.get("/:channelId/count", getSubscribersCount);

// /api/subscription/:channelId/list
// GET
router.get("/:channelId/list", getChannelSubscribers);

// /api/subscription/:channelId/is-subscribed
// GET
router.get("/:channelId/is-subscribed", authMiddleware, isSubscribed);

// ✅ NEW: SUBSCRIPTIONS FEED
// GET /api/subscription/feed?page=1
router.get("/feed", authMiddleware, getSubscriptionsFeed);

export default router;