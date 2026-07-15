import { Router } from "express"
import { registerController, loginController, getMeController, logoutController } from "../controllers/auth.controller.js"
import { registerValidation, loginValidation } from "../Validation/auth.validation.js"
import { authMiddleware } from "../middleware/auth.middleware.js"
import { authLimiter } from "../middleware/rateLimiter.middleware.js";
import { verifyOtp, sendOtp } from "../controllers/OTP.controller.js";

const authRoutes = Router()

// Register
// POST
// /api/auth/register
authRoutes.post("/register", registerValidation, registerController);

// Resend OTP
// POST
// /api/auth/send-otp
authRoutes.post("/send-otp", authLimiter, sendOtp);

// Verify OTP
// POST
// /api/auth/verify-otp
authRoutes.post("/verify-otp", verifyOtp);

// Login
// POST
// /api/auth/login
authRoutes.post("/login", authLimiter, loginValidation, loginController);

// Get Me
// GET
// /api/auth/getMe
authRoutes.get("/getMe", authMiddleware, getMeController)

// Logout
// POST
// /api/auth/logout
authRoutes.post("/logout", authMiddleware, logoutController)

export default authRoutes