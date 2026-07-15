import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: true
    },
    type: {
        type: String,
        enum: ["LIKE", "DISLIKE"],
        required: true
    }
}, { timestamps: true });

likeSchema.index({ user: 1, video: 1 }, { unique: true });
likeSchema.index({ video: 1, type: 1 });

const likeModel = mongoose.model("Like", likeSchema);

export default likeModel;