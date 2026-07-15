import mongoose from "mongoose";

const channelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    handle: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },

    description: {
        type: String,
        default: ""
    },

    avatar: {
        type: String,
        default: ""
    },

    banner: {
        type: String,
        default: ""
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    subscribersCount: {
        type: Number,
        default: 0
    },

    totalViews: {
        type: Number,
        default: 0
    },

    videosCount: {
        type: Number,
        default: 0
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    socialLinks: {
        twitter: String,
        instagram: String,
        website: String
    },

}, { timestamps: true });


const channelModel = mongoose.model("Channel", channelSchema);

export default channelModel;