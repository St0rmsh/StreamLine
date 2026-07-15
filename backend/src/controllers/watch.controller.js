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

    // 📈 Retention Tracking (20 buckets of 5% each)
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

    // 🧠 SMART VIEW: If watched > 5s and never counted, increment video views
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