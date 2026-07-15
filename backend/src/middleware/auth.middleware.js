import jwt from "jsonwebtoken";
import config from "../config/config.js";
import userModel from "../models/user.model.js";
import redis from "../config/cache.js";

export async function authMiddleware(req, res, next) {
    try {
        const token =
            req.cookies?.token ||
            req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized - No token provided",
                success: false
            });
        }

        // ✅ CHECK REDIS BLACKLIST
        const isBlacklisted = await redis.get(token);
        if (isBlacklisted) {
            return res.status(401).json({
                message: "Token expired (blacklisted)",
                success: false
            });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);

        const user = await userModel
            .findById(decoded.id)
            .select("-password");

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized - User not found",
                success: false
            });
        }

        req.user = user;

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Unauthorized - Invalid or expired token",
            success: false,
            err: error.message
        });
    }
}