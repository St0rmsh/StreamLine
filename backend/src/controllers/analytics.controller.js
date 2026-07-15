import videoModel from "../models/video.model.js";
import WatchHistory from "../models/watchHistory.model.js";
import channelModel from "../models/channel.model.js";
import mongoose from "mongoose";

/**
 * 📊 GET STUDIO DASHBOARD STATS
 */
export const getStudioStats = async (req, res) => {
    try {
        const userId = req.user._id;

        const channel = await channelModel.findOne({ owner: userId });
        if (!channel) return res.status(404).json({ message: "Channel not found" });

        const videoStats = await videoModel.aggregate([
            { $match: { uploader: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$views" },
                    totalVideos: { $sum: 1 },
                    avgTrustScore: { $avg: "$trustScore" }
                }
            }
        ]);

        const stats = videoStats[0] || { totalViews: 0, totalVideos: 0, avgTrustScore: 0 };

        const watchStats = await WatchHistory.aggregate([
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "videoInfo"
                }
            },
            { $unwind: "$videoInfo" },
            { $match: { "videoInfo.uploader": new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    totalProgress: { $sum: "$progress" }
                }
            }
        ]);

        const totalWatchTimeSeconds = watchStats[0]?.totalProgress || 0;
        const totalWatchTimeHours = (totalWatchTimeSeconds / 3600).toFixed(1);

        const retentionStats = await WatchHistory.aggregate([
             {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "videoInfo"
                }
            },
            { $unwind: "$videoInfo" },
            { $match: { "videoInfo.uploader": new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    buckets: { $push: "$retention" }
                }
            }
        ]);

        let avgRetention = new Array(20).fill(0);
        if (retentionStats[0]?.buckets?.length > 0) {
            const buckets = retentionStats[0].buckets;
            const count = buckets.length;
            buckets.forEach(b => {
                b.forEach((val, i) => {
                    avgRetention[i] += val;
                });
            });
            avgRetention = avgRetention.map(v => Math.round(v / count));
        }

        return res.json({
            success: true,
            stats: {
                totalViews: stats.totalViews,
                totalVideos: stats.totalVideos,
                watchTimeHours: totalWatchTimeHours,
                avgTrustScore: Math.round(stats.avgTrustScore || 0),
                subscribers: channel.subscribersCount || 0,
                retentionCurve: avgRetention
            }
        });

    } catch (err) {
        console.error("Studio stats error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};