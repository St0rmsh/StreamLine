import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null
    },
    reactions: {
      "👍": {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        default: []
      },
      "❤️": {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        default: []
      },
      "😂": {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        default: []
      }
    }
  },
  { timestamps: true }
);

commentSchema.index({ video: 1, parent: 1 });

const commentModel = mongoose.model("Comment", commentSchema);

export default commentModel;