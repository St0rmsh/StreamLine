import mongoose from "mongoose";

const viewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: true,
        index: true
    },
    ip: String
}, { timestamps: true });

viewSchema.index({ user: 1, video: 1 });
viewSchema.index({ ip: 1, video: 1 });

const viewModel = mongoose.model("View", viewSchema);

export default viewModel;