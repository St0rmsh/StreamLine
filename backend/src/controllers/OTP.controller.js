import otpModel from "../models/otp.model.js";
import { generateOTP } from "../utils/otp.js";
import { sendOTP } from "../services/email.service.js";
import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import config from "../config/config.js";



export const sendOtp = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    let record = await otpModel.findOne({ email });
    const now = Date.now();

    if (record) {
      const diff = now - record.firstRequestTime;

      if (diff < 60 * 1000) {
        if (record.requestCount >= 3) {
          return res.status(429).json({
            message: "Too many OTP requests. Try after 1 minute"
          });
        }

        record.requestCount += 1;
      } else {
        record.requestCount = 1;
        record.firstRequestTime = now;
      }
    } else {
      record = new otpModel({
        email,
        requestCount: 1,
        firstRequestTime: now
      });
    }

    const otp = generateOTP();

    record.otp = otp;
    record.expiresAt = new Date(now + 5 * 60 * 1000);
    record.attempts = 0;
    record.isVerified = false;

    await record.save();

    await sendOTP(email, otp);

    return res.json({
      success: true,
      message: "OTP sent"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Failed to send OTP"
    });
  }
};



export const verifyOtp = async (req, res) => {
  try {
    const { email: rawEmail, otp: rawOtp } = req.body;

    if (!rawEmail || !rawOtp) {
      return res.status(400).json({
        message: "Email and OTP are required",
        received: { email: !!rawEmail, otp: !!rawOtp }
      });
    }

    const email = rawEmail.toLowerCase().trim();
    const otp = rawOtp.toString().trim();

    const record = await otpModel.findOne({ email });

    if (!record) {
      return res.status(400).json({ message: "No registration found for this email. Please register again." });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    if (record.otp.toString().trim() !== otp) {
      return res.status(400).json({ message: "The OTP you entered is incorrect." });
    }

    if (!record.tempUser) {
      return res.status(400).json({ message: "Registration session lost. Please register again." });
    }

    const { name, username, password } = record.tempUser;

    const user = await userModel.create({
      name,
      username,
      email,
      password,
      isVerified: true
    });

    await otpModel.deleteOne({ email });

    const token = jwt.sign(
      { id: user._id },
      config.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      message: "Account created",
      user
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Verification failed"
    });
  }
};