import viewModel from "../models/view.model.js";
import videoModel from "../models/video.model.js";
import channelModel from "../models/channel.model.js";
import { getIO } from "../socket/connect.socket.js";

export const addView = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const videoId = req.params.videoId;
    const ip = req.ip;

    const cooldown = 60 * 1000;

    const lastView = await viewModel.findOne({
      video: videoId,
      $or: [
        ...(userId ? [{ user: userId }] : []),
        { ip }
      ]
    }).sort({ createdAt: -1 });

    if (lastView && (Date.now() - new Date(lastView.createdAt).getTime()) < cooldown) {
      return res.json({ success: true, message: "Cooldown active" });
    }

    await viewModel.create({
      user: userId,
      video: videoId,
      ip
    });

    const updatedVideo = await videoModel.findByIdAndUpdate(
      videoId,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!updatedVideo) {
      return res.status(404).json({ message: "Video not found" });
    }

    let updatedChannel = null;
    if (updatedVideo.channel) {
      updatedChannel = await channelModel.findByIdAndUpdate(
        updatedVideo.channel,
        { $inc: { totalViews: 1 } },
        { new: true }
      );
    }

    const io = getIO();
    io.to(`video_${videoId}`).emit("video:views:update", { videoId, views: updatedVideo.views });

    if (updatedChannel) {
      io.to(`channel_${updatedVideo.channel}`).emit("channel:views:update", {
        channelId: updatedVideo.channel,
        totalViews: updatedChannel.totalViews
      });
    }

    return res.json({
      success: true,
      views: updatedVideo.views
    });

  } catch (err) {
    console.error("Add view error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};