import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  expiresAt: Date,
  isVerified: Boolean,

  tempUser: {
    name: String,
    username: String,
    password: String
  },

  attempts: Number,
  requestCount: Number,
  firstRequestTime: Number
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const otpModel = mongoose.model("OTP", otpSchema);

export default otpModel;