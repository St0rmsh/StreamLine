import jwt from "jsonwebtoken";
import config from "../config/config.js";
import userModel from "../models/user.model.js";

/**
 * OPTIONAL AUTHENTICATION MIDDLEWARE
 * Attempts to decode the token and populate req.user,
 * but allows the request to proceed even if no token is present.
 */
export async function optionalAuth(req, res, next) {
    try {
        const token =
            req.cookies?.token ||
            req.headers.authorization?.split(" ")[1];

        if (!token) {
            return next(); // Proceed as guest
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);

        const user = await userModel
            .findById(decoded.id)
            .select("-password");

        if (user) {
            req.user = user;
        }

        next();
    } catch (error) {
        console.log("Optional Auth error (proceeding as guest):", error.message);
        next();
    }
}