import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useYT } from "../hook/useYT";

const EMOJIS = ["👍", "❤️", "😂"];

const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = { year: 31536000, month: 2592000, day: 86400, hour: 3600, minute: 60 };
  for (let key in intervals) {
    const value = Math.floor(seconds / intervals[key]);
    if (value >= 1) return `${value} ${key}${value > 1 ? "s" : ""} ago`;
  }
  return "just now";
};

const ReactionRow = ({ comment, parentId, currentUser }) => {
  const { reactToComment } = useYT();
  const [showBar, setShowBar] = useState(false);
  const reactions = comment.reactions || { "👍": 0, "❤️": 0, "😂": 0 };

  const handleReaction = (emoji) => {
    if (!currentUser) return;
    reactToComment({ commentId: comment._id, emoji, parentId });
    setShowBar(false);
  };

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowBar(!showBar)}
          className="text-[10px] font-bold text-gray-500 hover:text-stitch-black transition-colors"
        >
          React
        </button>
        <div className="flex gap-2 flex-wrap">
          {EMOJIS.map((emoji) =>
            reactions[emoji] > 0 && (
              <motion.button
                key={emoji}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => handleReaction(emoji)}
                className="px-2 py-1 text-xs rounded-full bg-gray-100 hover:bg-gray-200 flex items-center gap-1 transition-colors"
              >
                {emoji} {reactions[emoji]}
              </motion.button>
            )
          )}
        </div>
      </div>

      <AnimatePresence>
        {showBar && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute -top-11 left-0 flex gap-2 bg-white shadow-lg border border-border-main px-3 py-1.5 rounded-full z-10"
          >
            {EMOJIS.map((emoji) => (
              <motion.button
                key={emoji}
                whileTap={{ scale: 0.8 }}
                whileHover={{ scale: 1.3 }}
                onClick={() => handleReaction(emoji)}
                className="text-lg"
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CommentItem = ({ comment, onReply, currentUser, isReply = false, parentId = null }) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [expanded, setExpanded] = useState(false);

  const maxLength = 200;
  const displayedText = expanded || comment.text.length <= maxLength
    ? comment.text
    : comment.text.slice(0, maxLength) + "...";

  const submitReply = async () => {
    if (!replyText.trim()) return;
    await onReply(replyText, comment._id);
    setReplyText("");
    setShowReply(false);
  };

  return (
    <div className={`flex gap-3 sm:gap-4 group relative ${isReply ? "mt-4" : ""}`}>
      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold shrink-0 overflow-hidden">
        {comment.user?.avatar ? (
          <img src={comment.user.avatar} className="w-full h-full object-cover" />
        ) : (
          comment.user?.username?.charAt(0)?.toUpperCase() || "U"
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="font-semibold">{comment.user?.username || "User"}</span>
          <span className="text-gray-500 text-xs">• {formatTimeAgo(comment.createdAt)}</span>
        </div>

        <p className="mt-1 text-xs sm:text-sm text-stitch-grey-dark break-words leading-relaxed">
          {displayedText}
          {comment.text.length > maxLength && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="ml-1 text-indigo-500 hover:underline text-xs font-bold"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </p>

        <div className="mt-2 flex items-center gap-4">
          <ReactionRow comment={comment} parentId={isReply ? parentId : null} currentUser={currentUser} />
          {!isReply && (
            <button
              onClick={() => setShowReply(!showReply)}
              className="text-[10px] font-bold text-gray-500 hover:text-stitch-black transition-colors"
            >
              Reply
            </button>
          )}
        </div>

        {showReply && (
          <div className="mt-3 flex gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitReply()}
              placeholder="Write a reply..."
              autoFocus
              className="flex-1 border-b border-border-main p-1 text-xs outline-none focus:border-stitch-black transition-colors"
            />
            <button onClick={submitReply} className="text-xs font-bold text-indigo-500 hover:text-indigo-600">Post</button>
          </div>
        )}

        {!isReply && comment.replies?.length > 0 && (
          <div className="mt-2 ml-2 border-l-2 border-border-main pl-4 space-y-4">
            {comment.replies.map((r) => (
              <CommentItem
                key={r._id}
                comment={r}
                currentUser={currentUser}
                isReply
                parentId={comment._id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;