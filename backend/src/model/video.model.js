import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        default: ""
    },

    videoUrl: {
        type: String,
        default: ""
    },

    thumbnail: {
        type: String,
        default: ""
    },

    hlsUrl: {
        type: String,
        default: ""
    },

    duration: {
        type: Number,
        default: 0
    },

    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Channel",
        required: true,
        index: true
    },

    uploader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    views: {
        type: Number,
        default: 0
    },

    likesCount: {
        type: Number,
        default: 0,
    },

    dislikesCount: {
        type: Number,
        default: 0,
    },
    commentsCount: {
        type: Number,
        default: 0
    },

    tags: {
        type: [String],
        default: []
    },

    category: {
        type: String,
        default: "general"
    },

    visibility: {
        type: String,
        enum: ["public", "private", "unlisted"],
        default: "public"
    },

    isPublished: {
        type: Boolean,
        default: true
    },

    status: {
        type: String,
        enum: ["uploading", "processing", "ready", "failed"],
        default: "uploading"
    },

    // 🧾 Creator-disclosed AI usage (distinct from the system-detected aiGenerated below)
    isAiGenerated: {
        type: Boolean,
        default: false
    },

    // ⚡ Fast, automatic upload-time verification (agent-based pipeline)
    verification: {
        summary: String,

        claims: [
            {
                text: String,
                verdict: String,
                confidence: Number,
                explanation: String,
                sources: [String]
            }
        ],

        finalVerdict: {
            type: String,
            enum: ["TRUE", "PARTIALLY TRUE", "FALSE", "MISINFORMATION", "DISINFORMATION", "UNKNOWN"],
            default: "UNKNOWN"
        },

        confidence: Number,

        truth: String,

        issues: [String],

        sources: [String],

        checkedAt: Date
    },

    // 🔬 On-demand, multi-step deep re-check (claim-by-claim, with real sources)
    deepVerification: {
        status: {
            type: String,
            enum: ["idle", "running", "done", "failed"],
            default: "idle"
        },
        summary: String,
        claims: [
            {
                text: String,
                verdict: String,
                confidence: Number,
                explanation: String,
                sources: [String]
            }
        ],
        finalVerdict: String,
        confidence: Number,
        fraudScore: Number,
        riskLevel: String,
        aiDetection: {
            isAi: Boolean,
            modelUsed: String,
            confidence: Number,
            reasoning: String
        },
        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        checkedAt: Date,
        error: String
    },

    isFlagged: {
        type: Boolean,
        default: false
    },

    flagReason: {
        type: String,
        default: ""
    },
    deepfakeScore: {
        type: Number,
        default: 0
    },
    aiGenerated: {
        isAi: { type: Boolean, default: false },
        modelUsed: { type: String, default: "" },
        confidence: { type: Number, default: 0 }
    },
    transcript: {
        type: String,
        default: ""
    },

    totalWatchTime: {
        type: Number,
        default: 0
    },

    averageWatchTime: {
        type: Number,
        default: 0
    },

    trustScore: {
        type: Number,
        default: 0
    },

}, { timestamps: true });

videoSchema.index({
    title: "text",
    description: "text",
    tags: "text"
});

const videoModel = mongoose.model("Video", videoSchema);

export default videoModel