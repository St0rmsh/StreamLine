import mongoose from "mongoose";

const watchHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        index: true
    },
    progress: {
        type: Number,
        default: 0
    }, // last point reached in seconds
    retention: {
        type: [Number],
        default: () => new Array(20).fill(0) // 20 buckets of 5% each
    },
    sessionStart: {
        type: Date,
        default: Date.now
    },
    viewCounted: {
        type: Boolean,
        default: false
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// For History page: fetch a user's watched videos, most recent first
watchHistorySchema.index({ user: 1, lastUpdated: -1 });

const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);

export default WatchHistory;