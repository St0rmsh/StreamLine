import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import redis from "../config/cache.js";
import otpModel from "../models/otp.model.js";
import { generateOTP } from "../utils/otp.js";
import { sendOTP } from "../services/email.service.js";
import { getSignedUrl } from "../services/storage.service.js";



export async function registerController(req, res) {
    try {
        const name = req.body.name;
        const username = req.body.username?.toLowerCase().trim();
        const email = req.body.email?.toLowerCase().trim();
        const password = req.body.password;

        if (!email || !username || !password) {
            return res.status(400).json({
                message: "All fields required"
            });
        }

        const exists = await userModel.findOne({
            $or: [{ email }, { username }]
        });

        if (exists) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const otp = generateOTP();

        const now = Date.now();

        let record = await otpModel.findOne({ email });

        if (!record) {
            record = new otpModel({ email });
        }

        record.otp = otp;
        record.expiresAt = new Date(now + 5 * 60 * 1000);
        record.isVerified = false;

        record.tempUser = {
            name,
            username,
            password
        };

        await record.save();

        await sendOTP(email, otp);

        return res.json({
            success: true,
            message: "OTP sent to email"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}




export async function loginController(req, res) {

    try {

        const { username, password } = req.body

        const email = req.body.email?.toLowerCase().trim();

        if (!email && !username) {
            return res.status(400).json({
                message: "Email or Username required"
            })
        }

        if (!password) {
            return res.status(400).json({
                message: "Password required"
            })
        }

        const user = await userModel.findOne({
            $or: [
                { email },
                { username }
            ]
        })

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false,
                err: "user not found"
            })
        }

        const isMatched = await user.comparePassword(password)

        if (!isMatched) {
            return res.status(401).json({
                message: "Invalid credentials",
                success: false,
                err: "Invalid credentials"
            })
        }

        if (user.isSuspended) {
            return res.status(403).json({
                message: "Account suspended",
                success: false
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                message: "Please verify your account",
                success: false
            });
        }

        const token = jwt.sign({
            id: user._id
        }, config.JWT_SECRET, { expiresIn: "7d" })

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })


        return res.status(200).json({
            message: "User loggedIn Successfully",
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                avatar: getSignedUrl(user.avatar),
                isVerified: user.isVerified,
                subscribersCount: user.subscribersCount,
                subscribingCount: user.subscribingCount,
                videosCount: user.videosCount,
                totalViews: user.totalViews,
                isSuspended: user.isSuspended,
                suspendReason: user.suspendReason,
                subscribersPreview: user.subscribersPreview,
                provider: user.provider,
                channel: user.channel
            }
        })

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
            err: error.message
        })
    }
}


export async function getMeController(req, res) {

    try {

        const userId = req.user.id

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
                success: false,
                err: "Unauthorized"
            })
        }

        const user = await userModel.findById(userId).select("-password")

        if (!user) {
            return res.status(404).json({
                message: "User not Found",
                success: false,
                err: "User not found"
            })
        }

        const doc = user.toObject();
        doc.avatar = getSignedUrl(doc.avatar);

        return res.status(200).json({
            message: "User fetched Successfully",
            success: true,
            user: doc
        })

    } catch (error) {
        console.error("GetMe Error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
            err: error.message
        })
    }
}



export async function logoutController(req, res) {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(200).json({
                message: "Already logged out",
                success: true
            });
        }

        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });

        const isBlacklisted = await redis.get(token);

        if (!isBlacklisted) {
            try {
                const decoded = jwt.verify(token, config.JWT_SECRET);

                if (decoded?.exp) {
                    const expiry = Math.max(
                        decoded.exp - Math.floor(Date.now() / 1000),
                        0
                    );

                    if (expiry > 0) {
                        await redis.set(token, "blacklisted", "EX", expiry);
                    }
                }
            } catch (verifyErr) {
                // Token already invalid/expired — nothing to blacklist, cookie is cleared, that's enough.
            }
        }

        return res.status(200).json({
            message: "Logged out successfully",
            success: true
        });

    } catch (error) {
        console.error("Logout Error:", error);

        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
}