import WatchHistory from "../models/watchHistory.model.js";
import videoModel from "../models/video.model.js";

// every 5 sec
export const updateWatchTime = async (req, res) => {
  try {
    const { videoId, time, duration } = req.body;
    const userId = req.user._id;

    if (!videoId || typeof time !== "number" || time < 0) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const safeDuration = typeof duration === "number" && duration > 0 ? duration : 1;

    const bucketIndex = Math.min(19, Math.max(0, Math.floor((time / safeDuration) * 20)));

    let record = await WatchHistory.findOne({ user: userId, video: videoId });

    if (record) {
      record.progress = time;
      record.lastUpdated = new Date();

      record.retention[bucketIndex] = (record.retention[bucketIndex] || 0) + 1;
      record.markModified("retention");

      await record.save();
    } else {
      const newRetention = new Array(20).fill(0);
      newRetention[bucketIndex] = 1;

      record = await WatchHistory.create({
        user: userId,
        video: videoId,
        progress: time,
        retention: newRetention
      });
    }

    if (time > 5 && !record.viewCounted) {
      await videoModel.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
      record.viewCounted = true;
      await record.save();
    }

    return res.json({ success: true });

  } catch (err) {
    console.error("Update watch time error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getWatchTime = async (req, res) => {
  try {
    const { videoId } = req.params;

    const record = await WatchHistory.findOne({
      user: req.user.id,
      video: videoId
    });

    return res.json({ time: record?.progress || 0 });

  } catch (err) {
    console.error("Get watch time error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ LIST WATCH HISTORY (for the History page)
export const getWatchHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const history = await WatchHistory
      .find({ user: userId })
      .sort({ lastUpdated: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "video",
        select: "title thumbnail duration views createdAt channel status",
        populate: { path: "channel", select: "name handle avatar" }
      });

    // Filter out entries whose video was deleted (populate returns null)
    const validEntries = history.filter((h) => h.video);

    return res.json({
      success: true,
      history: validEntries.map((h) => ({
        _id: h._id,
        progress: h.progress,
        lastUpdated: h.lastUpdated,
        video: h.video
      }))
    });

  } catch (err) {
    console.error("Get watch history error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ CLEAR WATCH HISTORY
export const clearWatchHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    await WatchHistory.deleteMany({ user: userId });
    return res.json({ success: true, message: "History cleared" });
  } catch (err) {
    console.error("Clear watch history error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ REMOVE ONE HISTORY ENTRY
export const removeWatchHistoryEntry = async (req, res) => {
  try {
    const userId = req.user._id;
    const { entryId } = req.params;

    const entry = await WatchHistory.findOne({ _id: entryId, user: userId });
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    await WatchHistory.deleteOne({ _id: entryId });
    return res.json({ success: true });
  } catch (err) {
    console.error("Remove watch history entry error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};