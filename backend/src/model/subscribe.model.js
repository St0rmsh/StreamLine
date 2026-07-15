import mongoose from "mongoose";

const subscriberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Channel",
    required: true
  }
}, { timestamps: true });

// ✅ PREVENT DUPLICATES
subscriberSchema.index({ user: 1, channel: 1 }, { unique: true });

const subscriberModel = mongoose.model("Subscriber", subscriberSchema);

export default subscriberModel;