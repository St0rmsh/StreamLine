import subscriberModel from "../models/subscribe.model.js";
import Channel from "../models/channel.model.js";
import { getIO } from "../socket/connect.socket.js";

// ✅ TOGGLE SUBSCRIBE
export const toggleSubscribe = async (req, res) => {
  try {
    const userId = req.user._id;
    const { channelId } = req.params;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    if (channel.owner.toString() === userId.toString()) {
      return res.status(400).json({ message: "You can't subscribe to your own channel" });
    }

    const existing = await subscriberModel.findOne({
      user: userId,
      channel: channelId
    });

    let subscribed;

    if (existing) {
      await subscriberModel.deleteOne({ _id: existing._id });
      subscribed = false;
    } else {
      await subscriberModel.create({
        user: userId,
        channel: channelId
      });
      subscribed = true;
    }

    const count = await subscriberModel.countDocuments({
      channel: channelId
    });

    await Channel.findByIdAndUpdate(channelId, {
      subscribersCount: count
    });

    const io = getIO();
    io.to(`channel_${channelId}`).emit("channel:subscribers:update", {
      channelId,
      count
    });

    return res.json({
      success: true,
      subscribed,
      subscribersCount: count
    });

  } catch (err) {
    console.error("Toggle subscribe error:", err);
    return res.status(500).json({ message: "Subscription failed" });
  }
};

// ✅ CHECK SUBSCRIPTION
export const isSubscribed = async (req, res) => {
  try {
    const userId = req.user._id;
    const { channelId } = req.params;

    const exists = await subscriberModel.findOne({
      user: userId,
      channel: channelId
    });

    return res.json({
      success: true,
      subscribed: !!exists
    });

  } catch (err) {
    console.error("isSubscribed error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ GET COUNT
export const getSubscribersCount = async (req, res) => {
  try {
    const { channelId } = req.params;

    const count = await subscriberModel.countDocuments({
      channel: channelId
    });

    return res.json({
      success: true,
      count
    });

  } catch (err) {
    console.error("Get subscribers count error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getUserSubscriptions = async (req, res) => {
    try {
        const userId = req.user._id;

        const subscriptions = await subscriberModel.find({
            user: userId
        }).populate("channel", "name handle avatar subscribersCount");

        return res.json({
            success: true,
            subscriptions
        });

    } catch (err) {
        console.error("Get user subscriptions error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getChannelSubscribers = async (req, res) => {
    try {
        const { channelId } = req.params;

        const subscribers = await subscriberModel
            .find({ channel: channelId })
            .populate("user", "username avatar");

        return res.json({
            success: true,
            subscribers
        });

    } catch (err) {
        console.error("Get channel subscribers error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};