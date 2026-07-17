import commentModel from "../models/comment.model.js";
import videoModel from "../models/video.model.js";
import channelModel from "../models/channel.model.js";
import { getIO } from "../socket/connect.socket.js";

export const addComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { videoId } = req.params;
    const { text, parentId } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    if (parentId) {
      const parent = await commentModel.findById(parentId);
      if (!parent || parent.video.toString() !== videoId) {
        return res.status(400).json({ message: "Invalid parent comment" });
      }
    }

    const comment = await commentModel.create({
      video: videoId,
      user: userId,
      text: text.trim(),
      parent: parentId || null
    });

    await videoModel.findByIdAndUpdate(videoId, {
      $inc: { commentsCount: 1 }
    });

    const populated = await comment.populate("user", "username avatar");

    const io = getIO();
    if (parentId) {
      io.to(videoId).emit("comment:reply", { comment: populated, parentId });
    } else {
      io.to(videoId).emit("comment:new", { comment: populated });
    }

    return res.status(201).json({
      success: true,
      comment: populated
    });

  } catch (err) {
    console.error("Add comment error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const reactToComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { commentId } = req.params;
    const { emoji } = req.body;

    const ALLOWED = ["👍", "❤️", "😂"];
    if (!ALLOWED.includes(emoji)) {
      return res.status(400).json({ message: "Invalid reaction" });
    }

    const comment = await commentModel.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const alreadyReacted = comment.reactions[emoji]?.some(
      (id) => id.toString() === userId.toString()
    );

    ALLOWED.forEach((key) => {
      comment.reactions[key] = comment.reactions[key].filter(
        (id) => id.toString() !== userId.toString()
      );
    });

    if (!alreadyReacted) {
      comment.reactions[emoji].push(userId);
    }

    await comment.save();

    const counts = {
      "👍": comment.reactions["👍"].length,
      "❤️": comment.reactions["❤️"].length,
      "😂": comment.reactions["😂"].length
    };

    const io = getIO();
    io.to(comment.video.toString()).emit("comment:reaction", {
      commentId,
      reactions: counts
    });

    return res.status(200).json({
      success: true,
      reactions: counts,
      userReaction: alreadyReacted ? null : emoji
    });

  } catch (err) {
    console.error("React to comment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


// ➤ Get Comments for Video (threaded: top-level + nested replies)
export const getComments = async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({ message: "Video ID missing" });
    }

    const videoExists = await videoModel.findById(videoId);
    if (!videoExists) {
      return res.status(404).json({ message: "Video not found" });
    }

    const allComments = await commentModel
      .find({ video: videoId })
      .populate("user", "username avatar")
      .sort({ createdAt: -1 });

    const formatCounts = (c) => ({
      ...c.toObject(),
      reactions: {
        "👍": c.reactions?.["👍"]?.length || 0,
        "❤️": c.reactions?.["❤️"]?.length || 0,
        "😂": c.reactions?.["😂"]?.length || 0
      }
    });

    const formatted = allComments.map(formatCounts);

    const topLevel = formatted.filter((c) => !c.parent);
    const replies = formatted.filter((c) => c.parent);

    const threaded = topLevel.map((c) => ({
      ...c,
      replies: replies
        .filter((r) => r.parent.toString() === c._id.toString())
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    }));

    res.status(200).json({ comments: threaded });

  } catch (error) {
    console.error("GET COMMENTS ERROR:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ➤ Get Recent Comments across ALL of a creator's own videos (Dashboard feed)
export const getCreatorRecentComments = async (req, res) => {
  try {
    const userId = req.user._id;

    const channel = await channelModel.findOne({ owner: userId });
    if (!channel) {
      // No channel yet — nothing to show, not an error.
      return res.status(200).json({ comments: [] });
    }

    const myVideos = await videoModel
      .find({ channel: channel._id })
      .select("_id title thumbnail");

    if (myVideos.length === 0) {
      return res.status(200).json({ comments: [] });
    }

    const videoIds = myVideos.map((v) => v._id);
    const videoMap = myVideos.reduce((acc, v) => {
      acc[v._id.toString()] = { title: v.title, thumbnail: v.thumbnail };
      return acc;
    }, {});

    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    // Only top-level comments in the feed (replies clutter a summary view) —
    // creators can still open the video to see the full thread.
    const comments = await commentModel
      .find({ video: { $in: videoIds }, parent: null })
      .populate("user", "username avatar")
      .sort({ createdAt: -1 })
      .limit(limit);

    const formatted = comments.map((c) => ({
      _id: c._id,
      text: c.text,
      createdAt: c.createdAt,
      user: c.user,
      video: {
        _id: c.video,
        title: videoMap[c.video.toString()]?.title || "Untitled",
        thumbnail: videoMap[c.video.toString()]?.thumbnail || null
      }
    }));

    return res.status(200).json({ comments: formatted });

  } catch (err) {
    console.error("Get creator recent comments error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


// ➤ Delete Comment (owner of the comment, OR the channel owner of the video it's on)
export const deleteComment = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { commentId } = req.params;

        const comment = await commentModel.findById(commentId);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const isCommentAuthor = comment.user.toString() === userId.toString();

        let isVideoOwner = false;
        if (!isCommentAuthor) {
            const video = await videoModel.findById(comment.video).select("channel");
            if (video) {
                const channel = await channelModel.findById(video.channel).select("owner");
                isVideoOwner = channel && channel.owner.toString() === userId.toString();
            }
        }

        if (!isCommentAuthor && !isVideoOwner) {
            return res.status(403).json({ message: "Not allowed" });
        }

        const replyIds = await commentModel.find({ parent: commentId }).distinct("_id");
        const totalDeleted = 1 + replyIds.length;

        await commentModel.deleteMany({ _id: { $in: [commentId, ...replyIds] } });

        await videoModel.findByIdAndUpdate(comment.video, {
            $inc: { commentsCount: -totalDeleted }
        });

        return res.status(200).json({
            success: true,
            message: "Comment deleted"
        });

    } catch (err) {
        console.error("Delete comment error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};